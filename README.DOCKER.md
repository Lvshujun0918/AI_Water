# Docker 部署指南

本项目支持通过 Docker 进行容器化部署，提供了开发环境和生产环境两种部署方式，同时Github Actions提供了CI/CD流水线，用于自动构建和发布Docker镜像。

## 目录结构

```
.
├── Dockerfile              # 开发环境Dockerfile
├── Dockerfile.prod         # 生产环境Dockerfile
├── docker-compose.yml      # Docker Compose配置文件
├── .dockerignore           # Docker忽略文件
└── ... (其他项目文件)
```

## 环境要求

- Docker >= 18.09
- Docker Compose >= 1.25 (可选，用于简化多容器管理)

## 开发环境部署

### 使用 Docker Compose (推荐)

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up --build -d

# 停止所有服务
docker-compose down
```

### 使用纯 Docker 命令

```bash
# 构建镜像
docker build -t ai-water-system .

# 运行容器
docker run -p 3000:3000 -p 8080:8080 \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/users.db:/app/backend/users.db \
  ai-water-system
```

## 生产环境部署

### 构建生产环境镜像

```bash
# 使用生产环境Dockerfile构建
docker build -f Dockerfile.prod -t ai-water-system:prod .
```

### 运行生产环境容器

```bash
# 运行生产环境容器
docker run -p 3000:3000 \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/users.db:/app/backend/users.db \
  ai-water-system:prod
```

## 端口说明

- `3000`: 后端API服务端口
- `8080`: 前端开发服务器端口 (仅开发环境)

## 数据持久化

项目通过Docker卷实现数据持久化：

- `backend/uploads`: 音频文件存储目录
- `backend/users.db`: SQLite数据库文件

## Python 依赖说明

项目依赖以下Python库，已在Docker镜像中预装：

- `torch`: PyTorch机器学习框架
- `torchaudio`: 音频处理库
- `macls`: 音频分类库

这些依赖在Docker构建过程中自动安装，无需额外配置。

## 环境变量

可以通过环境变量配置应用行为：

```bash
# 设置Node环境
NODE_ENV=production

# 可根据需要添加其他环境变量
```

## 常见问题

### 1. 权限问题

如果遇到权限问题，可能需要调整挂载卷的权限：

```bash
# 在宿主机上设置目录权限
chmod -R 777 backend/uploads
```

### 2. Python依赖安装失败

如果Python依赖安装失败，可以尝试更换镜像源或检查网络连接。

### 3. 构建时间过长

首次构建可能需要较长时间，因为需要下载和安装所有依赖。后续构建会利用Docker缓存机制加快速度。

## 性能优化建议

1. 在生产环境中，建议使用反向代理（如Nginx）来提供静态文件服务
2. 可以根据实际需求调整Docker资源限制（CPU、内存）
3. 建议定期清理无用的Docker镜像和容器以节省磁盘空间