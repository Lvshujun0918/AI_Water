#!/bin/bash

# Docker镜像构建和推送脚本 - RISC-V 64位专用版本
# 仅用于RISC-V 64位设备，构建RISC-V镜像
# 集成前端构建，支持推送到GitHub Container Registry (GHCR)

set -e

# 配置
REGISTRY="ghcr.io"
GITHUB_USER="${GITHUB_USER:-Lvshujun0918}"
IMAGE_NAME="${IMAGE_NAME:-ai_water}"
DOCKERFILE_PROD="${DOCKERFILE_PROD:-Dockerfile.prod.riscv}"
FRONTEND_DIR="${FRONTEND_DIR:-frontend}"
ARCH="riscv64"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 显示用法
usage() {
    cat << EOF
用法: $0 [选项]

本脚本专用于 RISC-V 64位设备，仅构建 riscv64 镜像

选项:
    -t, --tag TAG              镜像标签 (默认: latest)
    -v, --version VERSION      版本号 (默认: 0.1.0)
    -u, --user USER            GitHub用户名 (默认: $GITHUB_USER)
    -d, --dockerfile FILE      Dockerfile路径 (默认: $DOCKERFILE_PROD)
    --no-frontend-build        跳过前端构建
    -p, --push                 构建后推送到GHCR
    --build-only               仅构建，不推送
    --push-only                仅推送，不构建
    -h, --help                 显示此帮助信息

示例:
    # 构建并推送 (需要 GITHUB_TOKEN)
    GITHUB_TOKEN=your_token $0 --push

    # 仅构建
    $0 --build-only

    # 推送已存在的镜像
    GITHUB_TOKEN=your_token $0 --push-only -t latest

    # 指定版本
    GITHUB_TOKEN=your_token $0 -t v1.0.0 -v 1.0.0 --push

环境变量:
    GITHUB_TOKEN               GitHub个人访问令牌 (推送时需要)
    GITHUB_USER                GitHub用户名 (默认: Lvshujun0918)
    IMAGE_NAME                 镜像名称 (默认: ai_water)

EOF
    exit 0
}

# 解析命令行参数
TAG="latest"
VERSION="0.1.0"
PUSH=false
BUILD_ONLY=false
PUSH_ONLY=false
BUILD_FRONTEND=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -u|--user)
            GITHUB_USER="$2"
            shift 2
            ;;
        -d|--dockerfile)
            DOCKERFILE_PROD="$2"
            shift 2
            ;;
        --no-frontend-build)
            BUILD_FRONTEND=false
            shift
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --push-only)
            PUSH_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "未知选项: $1"
            usage
            ;;
    esac
done

# 计算构建变量
BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# 规范化仓库名称（转小写）
IMAGE_NAME_LOWER=$(echo "$IMAGE_NAME" | tr '[:upper:]' '[:lower:]')

# 镜像完整名称
FULL_IMAGE_NAME="$REGISTRY/$GITHUB_USER/$IMAGE_NAME_LOWER"
IMAGE_TAG="$FULL_IMAGE_NAME:$TAG"
RISCV_TAG="$FULL_IMAGE_NAME:$ARCH-$GIT_COMMIT"

log_step "Docker镜像构建脚本 - RISC-V 64位"

log_info "架构: $ARCH"
log_info "Registry: $REGISTRY"
log_info "GitHub用户: $GITHUB_USER"
log_info "镜像名称: $IMAGE_NAME_LOWER"
log_info "镜像标签: $TAG"
log_info "版本号: $VERSION"
log_info "构建时间: $BUILD_TIME"
log_info "Git提交: $GIT_COMMIT"
log_info "Dockerfile: $DOCKERFILE_PROD"
log_info "前端构建: $([ "$BUILD_FRONTEND" = true ] && echo "启用" || echo "禁用")"

# 检查Dockerfile是否存在
if [ ! -f "$DOCKERFILE_PROD" ]; then
    log_error "Dockerfile不存在: $DOCKERFILE_PROD"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装或不在PATH中"
    exit 1
fi

log_info "检测到Docker: $(docker --version)"

# 构建前端
if [ "$BUILD_FRONTEND" = true ] && [ "$PUSH_ONLY" = false ]; then
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "前端目录不存在: $FRONTEND_DIR"
        exit 1
    fi
    
    log_step "构建前端静态文件"
    
    cd "$FRONTEND_DIR"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装"
        exit 1
    fi
    
    log_info "检测到Node.js: $(node --version)"
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm ci
    
    # 构建前端
    log_info "构建前端..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "前端构建成功"
    else
        log_error "前端构建失败"
        exit 1
    fi
    
    cd ..
fi

# 构建镜像
if [ "$PUSH_ONLY" = false ]; then
    log_step "构建Docker镜像 (RISC-V 64位)"
    
    log_info "构建riscv64镜像..."
    log_info "  标签1: $IMAGE_TAG"
    log_info "  标签2: $RISCV_TAG"
    
    docker build \
        -f "$DOCKERFILE_PROD" \
        --build-arg BUILD_TIME="$BUILD_TIME" \
        --build-arg VERSION="$VERSION" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        -t "$IMAGE_TAG" \
        -t "$RISCV_TAG" \
        .
    
    if [ $? -eq 0 ]; then
        log_success "riscv64镜像构建成功"
        log_info "镜像标签:"
        log_info "  - $IMAGE_TAG"
        log_info "  - $RISCV_TAG"
    else
        log_error "镜像构建失败"
        exit 1
    fi
fi

# 推送镜像
if [ "$PUSH" = true ] || [ "$PUSH_ONLY" = true ]; then
    log_step "推送riscv64镜像到GHCR"
    
    # 检查GitHub Token
    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "GITHUB_TOKEN环境变量未设置"
        log_info ""
        log_info "请设置GitHub个人访问令牌:"
        log_info "  export GITHUB_TOKEN=your_token"
        log_info ""
        log_info "获取令牌: https://github.com/settings/tokens"
        log_info "需要权限: write:packages, read:packages, delete:packages"
        exit 1
    fi
    
    # 登录到GHCR
    log_info "登录到GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login "$REGISTRY" -u "$GITHUB_USER" --password-stdin
    
    if [ $? -eq 0 ]; then
        log_success "登录成功"
    else
        log_error "登录GHCR失败"
        exit 1
    fi
    
    # 推送riscv64镜像标签
    for image_tag in "$IMAGE_TAG" "$RISCV_TAG"; do
        log_info "推送: $image_tag"
        docker push "$image_tag"
        
        if [ $? -eq 0 ]; then
            log_success "推送成功: $image_tag"
        else
            log_error "推送失败: $image_tag"
            exit 1
        fi
    done
    
    # 登出
    docker logout "$REGISTRY" 2>/dev/null
    
    log_step "推送完成"
    log_success "riscv64镜像已成功推送到GHCR"
    log_info "镜像地址:"
    log_info "  - $IMAGE_TAG"
    log_info "  - $RISCV_TAG"
    log_info ""
    log_info "使用镜像:"
    log_info "  docker pull $IMAGE_TAG"
    log_info "  docker run -d -p 80:80 $IMAGE_TAG"
fi

if [ "$BUILD_ONLY" = true ]; then
    log_success "构建完成！"
    log_info "要推送镜像，请运行:"
    log_info "  GITHUB_TOKEN=your_token $0 --push-only -t $TAG -v $VERSION"
fi

log_step "操作完成"
log_success "✓ 所有步骤已完成"
