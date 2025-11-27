#!/bin/bash

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 动画函数
show_spinner() {
    local pid=$!
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# 日志函数
log_info() {
    echo -e "${BLUE}${BOLD}[ℹ]${NC} ${CYAN}$1${NC}"
}

log_success() {
    echo -e "${GREEN}${BOLD}[✓]${NC} ${GREEN}$1${NC}"
}

log_warn() {
    echo -e "${YELLOW}${BOLD}[!]${NC} ${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}${BOLD}[✗]${NC} ${RED}$1${NC}"
}

log_step() {
    echo -e "${PURPLE}${BOLD}[→]${NC} ${BOLD}$1${NC}"
}

# 打印横幅
print_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   AI Water 部署脚本                         ║"
    echo "║                Docker Compose 自动部署工具                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${YELLOW}脚本开始时间: $(date)${NC}"
    echo -e "${YELLOW}=======================================================${NC}"
    echo
    mkdir -p ./ai-aiwater
    cd ./ai-aiwater
}

# 检查依赖
check_dependencies() {
    log_step "检查系统依赖..."
    
    local missing_deps=()
    
    # 检查 wget
    if ! command -v wget &> /dev/null; then
        missing_deps+=("wget")
    else
        log_success "wget 已安装"
    fi
    
    # 检查 docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    else
        log_success "Docker 已安装"
    fi
    
    # 检查 docker-compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    else
        log_success "Docker Compose 已安装"
    fi
    
    # 如果有缺失的依赖
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        echo
        log_info "请安装缺失的依赖后重新运行脚本"
        echo -e "${YELLOW}安装示例:${NC}"
        for dep in "${missing_deps[@]}"; do
            case $dep in
                "wget")
                    echo "  Ubuntu/Debian: sudo apt-get install wget"
                    echo "  CentOS/RHEL: sudo yum install wget"
                    ;;
                "docker")
                    echo "  参考: https://docs.docker.com/engine/install/"
                    ;;
                "docker-compose")
                    echo "  参考: https://docs.docker.com/compose/install/"
                    ;;
            esac
        done
        exit 1
    fi
}

directory_check() {
    log_step "检查工作目录..."
    
    if [ -d "uploads" ]; then
        log_warn "目录uploads已存在，将不再创建"
        chmod -R 777 ./uploads
    else
        log_info "创建所需uploads目录..."
        #以777权限创建目录uploads
        mkdir -p ./uploads
        chmod -R 777 ./uploads
    fi
    
    if [ -d "db" ]; then
        log_warn "目录db已存在，将不再创建"
        chmod -R 777 ./db
    else
        log_info "创建所需db目录..."
        #以777权限创建目录uploads
        mkdir -p ./db
        chmod -R 777 ./db
    fi    
}

# 下载 docker-compose.yml
download_compose_file() {
    local url="https://raw.githubusercontent.com/Lvshujun0918/AI_Water/refs/heads/main/docker-compose.yml"
    local filename="docker-compose.yml"
    
    log_step "下载 Docker Compose 配置文件..."
    log_info "URL: $url"

    if [ -f "$filename" ]; then
        log_warn "文件 $filename 已存在，创建备份..."
        mv "$filename" "$filename.backup.$(date +%Y%m%d_%H%M%S)"
        log_success "备份创建完成"
    fi
    
    if wget -q --show-progress "$url"; then
        log_success "配置文件下载成功"
        
        # 显示文件信息
        if [ -f "$filename" ]; then
            local file_size=$(du -h "$filename" | cut -f1)
            local line_count=$(wc -l < "$filename" 2>/dev/null || echo "未知")
            log_info "文件大小: $file_size"
            log_info "文件行数: $line_count"
        fi
    else
        log_error "配置文件下载失败"
        log_info "请检查:"
        log_info "1. 网络连接"
        log_info "2. URL 是否正确"
        log_info "3. GitHub 可访问性"
        exit 1
    fi
}

# 验证 docker-compose 文件
validate_compose_file() {
    log_step "验证 Docker Compose 文件..."
    
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml 文件不存在"
        exit 1
    fi
    
    # 检查文件是否为空
    if [ ! -s "docker-compose.yml" ]; then
        log_error "docker-compose.yml 文件为空"
        exit 1
    fi
    
    # 尝试解析 YAML
    if command -v docker-compose &> /dev/null; then
        if docker-compose config -q &> /dev/null; then
            log_success "Docker Compose 文件语法正确"
        else
            log_error "Docker Compose 文件语法错误"
            exit 1
        fi
    else
        log_warn "跳过语法验证 (docker-compose 不可用)"
    fi
    
    # 显示服务信息
    log_info "检测到的服务:"
    if command -v docker-compose &> /dev/null; then
        docker-compose config --services | while read service; do
            echo -e "  ${GREEN}•${NC} $service"
        done
    fi
}

# 拉取镜像
fetch_images() {
    log_step "拉取 Docker 镜像..."
    docker pull $(grep -oP '(?<=image: ).*' docker-compose.yml | tr '\n' ' ')
    log_success "镜像拉取完成"
}

# 显示系统信息
show_system_info() {
    log_step "系统信息检查..."
    
    # Docker 信息
    log_info "Docker 版本: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose 版本: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)"
    else
        log_info "Docker Compose 版本: $(docker compose version --short)"
    fi
    
    # 系统资源
    local total_mem=$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo "未知")
    local available_mem=$(free -h 2>/dev/null | awk '/^Mem:/ {print $7}' || echo "未知")
    local disk_free=$(df -h . | awk 'NR==2 {print $4}')
    
    log_info "总内存: $total_mem"
    log_info "可用内存: $available_mem"
    log_info "磁盘剩余空间: $disk_free"
}

# 启动服务
start_services() {
    log_step "启动 Docker Compose 服务..."
    echo
    echo -e "${YELLOW}=======================================================${NC}"
    echo -e "${GREEN}${BOLD}服务启动中...${NC}"
    echo -e "${YELLOW}=======================================================${NC}"
    echo
    
    docker-compose up -d
}

# 显示完成信息
show_completion() {
    echo
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                       部署完成！                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}AI Water 服务已成功启动！${NC}"
    echo
    echo -e "${YELLOW}常用命令:${NC}"
    echo -e "  ${CYAN}查看服务状态:${NC} docker-compose ps"
    echo -e "  ${CYAN}查看日志:${NC} docker-compose logs"
    echo -e "  ${CYAN}停止服务:${NC} docker-compose down"
    echo -e "  ${CYAN}重启服务:${NC} docker-compose restart"
    echo
    echo -e "${YELLOW}脚本结束时间: $(date)${NC}"
}

# 主函数
main() {
    print_banner
    
    # 检查依赖
    check_dependencies
    
    # 显示系统信息
    show_system_info

    # 创建目录
    directory_check
    
    # 下载配置文件
    download_compose_file
    
    # 验证配置文件
    validate_compose_file

    # 拉取镜像
    fetch_images
    
    # 启动服务
    start_services
    
    # 显示完成信息 (如果服务在前台运行，这里不会执行)
    show_completion
}

# 信号处理
trap 'echo -e "\n${YELLOW}[!] 脚本被用户中断${NC}"; exit 1' INT TERM

# 执行主函数
main "$@"