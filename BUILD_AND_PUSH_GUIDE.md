# Docker镜像构建和推送指南 - Linux版本

本脚本用于在Linux上本地构建Docker镜像（含前端编译）并推送到GitHub Container Registry (GHCR)。

## 快速开始

### 前置要求

1. **安装Docker**
   - [Docker官网](https://www.docker.com/products/docker-desktop)
   - 或使用系统包管理器：`apt install docker.io` (Ubuntu/Debian)

2. **安装Node.js** (用于前端构建)
   - [Node.js官网](https://nodejs.org/) (LTS版本)
   - 或使用系统包管理器

3. **创建GitHub个人访问令牌 (Personal Access Token)**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token"
   - 勾选以下权限：
     - `write:packages` - 推送包
     - `read:packages` - 读取包
     - `delete:packages` - 删除包
   - 复制生成的token，妥善保管

4. **设置GitHub Token环境变量**

   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```

## 使用脚本

### Bash脚本

```bash
# 给脚本添加执行权限
chmod +x build-and-push.sh

# 查看帮助
./build-and-push.sh --help

# 仅构建镜像（包含前端编译）
./build-and-push.sh --build-only

# 构建前端并推送到GHCR
./build-and-push.sh --push -t latest -v 0.1.0

# 仅推送已有镜像
./build-and-push.sh --push-only -t latest

# 跳过前端构建，直接构建镜像
./build-and-push.sh --build-only --no-frontend-build
```

## 脚本参数说明

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-t, --tag TAG` | 镜像标签 | `latest` |
| `-v, --version VERSION` | 版本号 | `0.1.0` |
| `-u, --user USER` | GitHub用户名 | `Lvshujun0918` |
| `-d, --dockerfile FILE` | Dockerfile路径 | `Dockerfile.prod.riscv` |
| `--no-frontend-build` | 跳过前端构建 | - |
| `-p, --push` | 构建后推送 | 不推送 |
| `--build-only` | 仅构建 | - |
| `--push-only` | 仅推送 | - |
| `-h, --help` | 显示帮助 | - |

## 使用示例

### 示例1：构建版本为1.0.0的镜像并推送

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./build-and-push.sh --tag v1.0.0 --version 1.0.0 --push
```

### 示例2：仅构建镜像（包含前端编译）

```bash
./build-and-push.sh --build-only
```

### 示例3：跳过前端构建，仅构建Docker镜像

```bash
./build-and-push.sh --build-only --no-frontend-build
```

### 示例4：使用自定义Dockerfile

```bash
./build-and-push.sh --dockerfile Dockerfile --tag custom-tag --push
```

### 示例5：仅推送已有镜像

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./build-and-push.sh --push-only -t latest -v 0.1.0
```

## 构建后的镜像位置

构建完成后，镜像会被推送到：

```
ghcr.io/Lvshujun0918/ai-water-leak-detection:latest
ghcr.io/Lvshujun0918/ai-water-leak-detection:v0.1.0
```

可以使用以下命令拉取和运行：

```bash
# 拉取镜像
docker pull ghcr.io/Lvshujun0918/ai-water-leak-detection:latest

# 运行容器
docker run -d -p 80:80 ghcr.io/Lvshujun0918/ai-water-leak-detection:latest
```

## 故障排查

### 登录GHCR失败

1. 确认GITHUB_TOKEN环境变量已正确设置
2. 检查Token是否过期或无效
3. 验证Token具有正确的权限：
   - `write:packages`
   - `read:packages`
   - `delete:packages`

### Docker构建失败

1. 确认Docker已安装并运行
2. 检查Dockerfile路径是否正确
3. 查看Docker构建输出中的错误信息
4. 确保当前目录是项目根目录

### 镜像推送缓慢

- 这是正常的，大型镜像推送可能需要数分钟
- 检查网络连接速度
- 考虑使用本地registry mirror加速

## 环境变量详解

### GITHUB_TOKEN## 工作流说明

脚本执行流程（仅构建并推送时）：

1. **前端构建** (可选)
   - 进入 `frontend/` 目录
   - 运行 `npm ci` 安装依赖
   - 运行 `npm run build` 编译前端
   - 生成静态文件到 `frontend/dist`

2. **Docker镜像构建**
   - 使用 `Dockerfile.prod.riscv` 构建镜像
   - 注入构建参数（BUILD_TIME, VERSION, GIT_COMMIT）
   - 生成两个标签：`latest` 和 `riscv64-{git-sha}`

3. **镜像推送**
   - 使用 GITHUB_TOKEN 登录GHCR
   - 推送两个镜像标签
   - 完成后登出

## 构建输出

脚本会生成以下镜像标签：

```
ghcr.io/Lvshujun0918/ai-water-leak-detection:latest
ghcr.io/Lvshujun0918/ai-water-leak-detection:riscv64-{git-sha}
```

## 常用命令速查

### 查看已构建的镜像

```bash
docker images | grep ai-water-leak-detection
```

### 删除本地镜像

```bash
docker rmi ghcr.io/Lvshujun0918/ai-water-leak-detection:latest
```

### 查看容器日志

```bash
docker logs <container_id>
```

### 进入容器

```bash
docker exec -it <container_id> /bin/bash
```

## 故障排查

### 前端构建失败

1. 检查Node.js版本：`node --version` (需要v18+)
2. 检查npm：`npm --version`
3. 尝试清除npm缓存：`npm cache clean --force`
4. 重新安装依赖：`rm -rf frontend/node_modules && npm ci`

### Docker构建失败

1. 检查Docker运行状态：`docker ps`
2. 查看构建输出中的详细错误
3. 确保有足够的磁盘空间：`df -h`
4. 检查Dockerfile路径是否正确

### 推送失败

1. 验证GITHUB_TOKEN是否正确：`echo $GITHUB_TOKEN`
2. 检查token是否有过期
3. 验证权限：token需要 `write:packages` 权限
4. 检查网络连接

## 安全建议

1. **不要在脚本中硬编码Token** - 使用环境变量
2. **定期轮换Token** - 从GitHub设置页面创建新token并删除旧token
3. **限制Token权限** - 只赋予必要的权限
4. **不要在公开渠道分享Token** - 如被泄露，立即删除该token

## 相关资源

- [GitHub Container Registry 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build 文档](https://docs.docker.com/engine/reference/commandline/build/)
- [Docker Push 文档](https://docs.docker.com/engine/reference/commandline/push/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 许可证

此脚本遵循项目相同的许可证。

## 支持

遇到问题？

1. 查看上面的"故障排查"部分
2. 查看脚本输出中的详细错误信息
3. 参考相关资源链接
4. 在项目issue中寻求帮助
