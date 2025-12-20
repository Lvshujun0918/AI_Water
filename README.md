# AI智慧水务检漏系统

基于 Vue3 + Element Plus 构建的水务管网漏水音频识别后台管理系统，用于管理和分析上传的音频文件，及时发现漏水点，解放人类手动检测的耗时和误差。系统使用深度学习模型对音频进行分类和风险评估。

## 项目截图
<img width="2550" height="2480" alt="image" src="https://github.com/user-attachments/assets/d73a9274-dea6-4e46-aef2-9cdfaa044c22" />
<img width="2196" height="673" alt="image" src="https://github.com/user-attachments/assets/bd057d34-7ff2-4202-9dec-fd7cb5716d38" />
<img width="2166" height="1118" alt="image" src="https://github.com/user-attachments/assets/8bf340dc-35ec-4e07-90e0-365b2f84ed62" />
<img width="513" height="618" alt="image" src="https://github.com/user-attachments/assets/fbc9c861-6ea3-4be8-96eb-26d273f060f9" />

## 项目概述

这是一个前后端分离的管理系统，采用现代化技术栈：

- **前端**：Vue3 + Element Plus + Vite 构建响应式用户界面
- **后端**：Node.js + Express 提供 RESTful API 服务
- **AI 模型**：Python + PyTorch 进行音频分类识别

### 主要功能

- ✅ 用户认证和权限管理
- ✅ 音频文件上传和管理
- ✅ 基于 AI 模型的音频风险评估
- ✅ 数据可视化展示（仪表板、趋势分析）
- ✅ 系统初始化和管理员设置
- ✅ 音频记录查询和历史分析

## 技术架构

### 前端技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | 渐进式 JavaScript 框架 |
| Element Plus | 基于 Vue 3 的组件库 |
| Vue Router | 路由管理 |
| Axios | HTTP 客户端 |
| ECharts | 数据可视化库 |
| Vite | 构建工具 |

### 后端技术栈

| 技术 | 说明 |
|------|------|
| Node.js | JavaScript 运行时环境 |
| Express | Web 应用框架 |
| SQLite | 轻量级数据库 |
| BCrypt | 密码加密库 |
| JWT | JSON Web Token 认证 |
| Multer | 文件上传中间件 |
| Python Shell | Python 脚本执行 |

### AI 模型依赖

| 库 | 说明 |
|------|------|
| PyTorch | 深度学习框架 |
| macls | 音频分类库 |
| torchaudio | 音频处理库 |
| numpy / scipy | 科学计算库 |

## 环境要求

### 基础环境

- **Node.js** >= 18.x (推荐使用 LTS 版本)
- **Python** >= 3.8
- **npm** >= 9.x
- **Docker** >= 18.09 (可选，用于容器化部署)
- **Git** >= 2.0

### Python 环境配置

项目支持两种 PyTorch 安装方式：

```bash
# 方式1：标准安装 (无 CUDA 支持)
pip install torch torchvision torchaudio

# 方式2：从源码安装最新功能
git clone https://github.com/yeyupiaoling/AudioClassification-Pytorch.git
cd AudioClassification-Pytorch/
pip install .
```

## 快速开始

### 方式1：一键脚本安装 (推荐)

#### AMD64 架构
```bash
curl -sSL https://raw.githubusercontent.com/Lvshujun0918/AI_Water/refs/heads/main/install.sh | bash
```

#### RISC-V 架构
```bash
curl -sSL https://raw.githubusercontent.com/Lvshujun0918/AI_Water/refs/heads/main/install-riscv.sh | bash
```

启动完成后，使用浏览器访问：**http://localhost:8080**

### 方式2：编译安装

#### 1. 克隆项目

```bash
git clone https://github.com/Lvshujun0918/AI_Water
cd AI_Water
```

#### 2. 安装依赖

```bash
# 安装项目根目录依赖
npm install

# 安装前端依赖
cd frontend && npm install && cd ..

# 安装后端依赖
cd backend && npm install && cd ..
```

#### 3. 启动项目

```bash
# 开发环境一键启动 (同时启动前后端)
npm run dev

# 或分别启动

# 启动后端服务 (http://localhost:3000)
npm run dev:backend

# 启动前端服务 (http://localhost:8080)
npm run dev:frontend
```

#### 4. 生产环境构建

```bash
# 构建前端
npm run build

# 生产环境会自动使用优化后的输出
```

## Docker 部署

### 快速开始

#### 使用 Docker Compose (推荐)

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up --build -d

# 停止服务
docker-compose down
```

#### 使用纯 Docker

```bash
# 构建镜像
docker build -t ai-water-system .

# 运行开发环境容器
docker run -p 3000:3000 -p 8080:8080 \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/users.db:/app/backend/users.db \
  ai-water-system

# 运行生产环境容器
docker build -f Dockerfile.prod -t ai-water-system:prod .
docker run -p 3000:3000 \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/users.db:/app/backend/users.db \
  ai-water-system:prod
```

### Docker 环境变量

```bash
# 设置 Node 环境 (开发或生产)
NODE_ENV=production
```

### 端口说明

| 端口 | 服务 | 用途 |
|------|------|------|
| 3000 | 后端 API | REST API 接口服务 |
| 8080 | 前端 | Web 用户界面 (开发环境) |
| 80 | Nginx | 生产环境反向代理 |

### 数据持久化

项目通过 Docker 卷实现数据持久化：

```
backend/uploads    → 用户上传的音频文件存储
backend/users.db   → SQLite 数据库 (用户、记录等)
```

## RISC-V 构建与 PyTorch Wheel 编译

### Docker 镜像构建脚本 (`build-and-push.sh`)

本项目提供 **RISC-V 64位专用** 的自动化 Docker 构建脚本，可将镜像推送到 GitHub Container Registry (GHCR)。

#### 前置要求

1. **Docker** >= 18.09 - `apt install docker.io`
2. **Node.js >= 18** - 用于前端构建
3. **GitHub Token** - 用于推送到 GHCR

#### 创建 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选权限：`write:packages`、`read:packages`、`delete:packages`
4. 复制 Token：`export GITHUB_TOKEN=ghp_xxxxxxxxxxxx`

#### 快速开始

```bash
chmod +x build-and-push.sh

# 构建并推送到 GHCR
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./build-and-push.sh --push -t latest -v 0.1.0

# 仅构建镜像
./build-and-push.sh --build-only

# 跳过前端构建
./build-and-push.sh --push --no-frontend-build
```

#### 脚本参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-t, --tag` | 镜像标签 | `latest` |
| `-v, --version` | 版本号 | `0.1.0` |
| `-u, --user` | GitHub 用户名 | `lvshujun0918` |
| `-d, --dockerfile` | Dockerfile 路径 | `Dockerfile.prod.riscv` |
| `--no-frontend-build` | 跳过前端构建 | - |
| `-p, --push` | 构建后推送 | 不推送 |
| `--build-only` / `--push-only` | 仅构建或推送 | - |

#### 构建流程

1. **前端编译** - npm ci → npm run build
2. **Docker 构建** - 使用 Dockerfile.prod.riscv，注入 BUILD_TIME/VERSION/GIT_COMMIT
3. **镜像推送** - 推送到 ghcr.io，生成标签：latest + riscv64-{commit}

#### 使用示例

```bash
# 完整构建并推送
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./build-and-push.sh --tag v1.0.0 --version 1.0.0 --push

# 拉取并运行
docker pull ghcr.io/lvshujun0918/ai_water-riscv:latest
docker run -d -p 80:80 ghcr.io/lvshujun0918/ai_water-riscv:latest
```

---

### PyTorch/Vision/Audio Wheel 编译 (`build-wheels-riscv.sh`)

本项目支持在 **RISC-V 设备** 和 **非 RISC-V 主机**（x86_64）上通过 QEMU 模拟构建 PyTorch、Vision、Audio wheels。

#### 环境要求

- Docker >= 20.10 (支持 `--platform` 标志)
- bash >= 4.0
- 磁盘空间：10-30GB (build 可能较大)

#### 快速开始

**在 RISC-V 设备上原生编译：**
```bash
chmod +x build-wheels-riscv.sh
./build-wheels-riscv.sh
# 输出到 ./whl/output
```

**在 x86_64 上交叉编译 RISC-V wheels（QEMU 模拟）：**
```bash
PLATFORM=riscv64 OUTPUT_DIR=/tmp/riscv-wheels ./build-wheels-riscv.sh
```

**自动检测平台：**
```bash
PLATFORM=auto ./build-wheels-riscv.sh
```

#### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PLATFORM` | 目标平台：`riscv64`、`amd64` 或 `auto` | `riscv64` |
| `OUTPUT_DIR` | wheels 输出目录 | `./whl/output` |
| `DOCKERFILE` | Dockerfile 路径 | `Dockerfile.whl` |

#### 构建时间估计

| 场景 | 时间 | 备注 |
|------|------|------|
| RISC-V 原生编译 | 2-6 小时 | 取决于硬件 |
| x86_64 QEMU 模拟 | 4-12 小时 | QEMU 增加 2-3x 开销 |
| 增量构建 | 15-30 分钟 | Docker 缓存加速 |

#### 构建产物

编译完成后的 wheels 目录结构：
```
whl/output/
├── torch-2.x.x-cp312-...-linux_riscv64.whl
├── torchaudio-2.x.x-cp312-...-linux_riscv64.whl
├── torchvision-0.x.x-cp312-...-linux_riscv64.whl
└── *.whl  (其他依赖)
```

#### 故障排查

**问题：exec format error (QEMU 兼容性)**
```bash
# 自动修复
PLATFORM=riscv64 ./build-wheels-riscv.sh

# 或手动设置 QEMU binfmt
docker run --rm --privileged tonistiigi/binfmt:latest --install riscv64

# 诊断脚本
chmod +x test-qemu-riscv.sh
./test-qemu-riscv.sh
```

**问题：磁盘空间不足**
```bash
docker system prune -a
OUTPUT_DIR=/mnt/large-disk/wheels ./build-wheels-riscv.sh
```

**问题：权限错误**
```bash
mkdir -p "${OUTPUT_DIR}"
chmod 777 "${OUTPUT_DIR}"
./build-wheels-riscv.sh
```

#### CI/CD 集成

GitHub Actions 示例：
```yaml
name: Build RISC-V Wheels
on: [push, workflow_dispatch]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v2
        with:
          platforms: riscv64
      - run: PLATFORM=riscv64 OUTPUT_DIR=./wheels ./build-wheels-riscv.sh
      - uses: actions/upload-artifact@v3
        with:
          name: riscv64-wheels
          path: ./wheels/*.whl
```

---

### 镜像与 Wheel 安全建议

- ⚠️ **Token 管理** - 不要硬编码，始终使用环境变量
- 🔄 **定期轮换** - 定期创建新 Token，删除旧的
- 🔒 **权限最小化** - 只赋予必要的权限范围
- 🚫 **泄露应急** - 如发现 Token 泄露，立即删除并重新生成

## 项目结构

```
.
├── backend/                          # 后端服务
│   ├── py/                          # Python AI 模型
│   │   ├── config/                  # 模型配置文件
│   │   ├── dataset/                 # 数据集和标签
│   │   ├── model/                   # 预训练模型权重
│   │   └── predict.py               # 推理脚本
│   ├── uploads/                     # 上传文件目录
│   ├── utils/                       # 工具函数 (JWT等)
│   ├── server.js                    # Express 主服务
│   ├── package.json
│   └── users.db                     # SQLite 数据库
│
├── frontend/                         # 前端应用
│   ├── src/
│   │   ├── components/              # Vue 组件
│   │   ├── views/                   # 页面组件
│   │   │   ├── Login.vue            # 登录页
│   │   │   ├── Dashboard.vue        # 仪表板
│   │   │   ├── Upload.vue           # 上传页
│   │   │   ├── Records.vue          # 记录页
│   │   │   ├── UserManagement.vue   # 用户管理
│   │   │   ├── Profile.vue          # 个人资料
│   │   │   └── Home.vue             # 首页
│   │   ├── router/                  # 路由配置
│   │   ├── config/                  # API 配置
│   │   ├── styles/                  # 全局样式 (glassmorphism)
│   │   ├── App.vue
│   │   └── main.js
│   ├── dist/                        # 构建输出 (生产环境)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── docs/                            # 文档
├── whl/                             # Python 轮包
│   └── AudioClassification-Pytorch/ # 音频分类库源码
│
├── Dockerfile                       # 开发环境镜像
├── Dockerfile.prod                  # 生产环境镜像 (AMD64)
├── Dockerfile.prod.riscv            # 生产环境镜像 (RISC-V)
├── docker-compose.yml               # Docker Compose 配置
├── nginx.conf                       # Nginx 配置
├── build-and-push.sh                # RISC-V 构建脚本
├── install.sh                       # AMD64 一键安装脚本
├── install-riscv.sh                 # RISC-V 一键安装脚本
├── package.json                     # 根目录脚本配置
└── README.md                        # 本文件
```

## API 接口

### 认证接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/init-status` | GET | 检查系统初始化状态 |
| `/api/init-admin` | POST | 初始化管理员账户 |
| `/api/login` | POST | 用户登录 |
| `/api/profile` | GET | 获取用户信息 |
| `/api/logout` | POST | 用户登出 |

### 音频接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/upload-audio` | POST | 上传音频文件 |
| `/api/audio-files` | GET | 获取音频文件列表 |
| `/api/audio/{id}` | GET | 获取单个音频详情 |
| `/api/audio/{id}/delete` | DELETE | 删除音频文件 |

### 用户管理接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/users` | GET | 获取用户列表 |
| `/api/users` | POST | 创建新用户 |
| `/api/users/{id}` | PUT | 更新用户信息 |
| `/api/users/{id}` | DELETE | 删除用户 |

更多接口详情请查看 [backend/server.js](backend/server.js)。

## 使用说明

### 首次使用

1. **访问初始化页面**
   - 在浏览器打开 http://localhost:8080
   - 进入系统初始化页面

2. **创建管理员账户**
   - 填写用户名、邮箱、密码
   - 确认初始化

3. **登录系统**
   - 使用刚创建的管理员账户登录

4. **上传和分析**
   - 在 "上传" 页面选择音频文件
   - 系统自动进行 AI 分析
   - 在 "记录" 页面查看分析结果

### 系统限制

| 限制项 | 值 |
|--------|-----|
| 音频文件大小 | 50 MB |
| 支持格式 | .mp3, .wav, .flac, .ogg |
| 数据库类型 | SQLite (开发)，建议生产环境迁移到 PostgreSQL |
| 并发用户数 | 建议不超过 100 |

## 常见问题

### Q: 如何修改系统配置？
A: 后端配置在 `backend/server.js`，前端配置在 `frontend/src/config/api.js`。

### Q: Python 模型加载失败怎么办？
A: 
1. 检查 Python 环境：`python --version`
2. 检查依赖：`pip list | grep torch`
3. 查看模型文件是否存在：`backend/py/model/model.pth`

### Q: 如何在 RISC-V 设备上部署？
A: 使用提供的 RISC-V 构建脚本：
```bash
chmod +x build-and-push.sh
./build-and-push.sh --push
```

### Q: 生产环境推荐配置？
A: 
- 使用 Nginx 作为反向代理
- 使用 PostgreSQL 代替 SQLite
- 启用 HTTPS (Let's Encrypt)
- 配置 CDN 加速静态资源
- 使用 Docker 和 Kubernetes 部署

## 许可证

本项目采用 **MIT 许可证**。详见 [LICENSE](LICENSE) 文件。

### 第三方依赖许可证

#### 前端依赖

| 包 | 许可证 | 链接 |
|----|---------|------|
| vue | MIT | https://github.com/vuejs/core |
| element-plus | MIT | https://github.com/element-plus/element-plus |
| vue-router | MIT | https://github.com/vuejs/router |
| axios | MIT | https://github.com/axios/axios |
| echarts | Apache-2.0 | https://github.com/apache/echarts |
| vue-echarts | MIT | https://github.com/ecomfe/vue-echarts |

#### 后端依赖

| 包 | 许可证 | 链接 |
|----|---------|------|
| express | MIT | https://github.com/expressjs/express |
| sqlite3 | BSD-3-Clause | https://github.com/TryGhost/node-sqlite3 |
| bcrypt | MIT | https://github.com/kelektiv/node.bcrypt.js |
| jsonwebtoken | MIT | https://github.com/auth0/node-jsonwebtoken |
| multer | MIT | https://github.com/expressjs/multer |
| python-shell | MIT | https://github.com/extrabacon/python-shell |
| cors | MIT | https://github.com/expressjs/cors |
| body-parser | MIT | https://github.com/expressjs/body-parser |

#### Python 依赖

| 包 | 许可证 | 链接 |
|----|---------|------|
| torch (PyTorch) | BSD-3-Clause | https://github.com/pytorch/pytorch |
| macls | Apache-2.0 | https://github.com/yeyupiaoling/AudioClassification-Pytorch |

## 相关资源

- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Express 文档](https://expressjs.com/)
- [PyTorch 文档](https://pytorch.org/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker 文档](https://docs.docker.com/)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 本项目
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 开启 Pull Request

### 代码规范

- 前端：遵循 Vue 3 组合式 API 最佳实践
- 后端：使用 ES6+ 语法，遵循 Node.js 最佳实践
- Python：遵循 PEP 8 规范

## 支持和反馈

- 📝 提交 Issue：[GitHub Issues](https://github.com/Lvshujun0918/AI_Water/issues)
- 💬 讨论问题：[GitHub Discussions](https://github.com/Lvshujun0918/AI_Water/discussions)
- 📧 邮件反馈：[项目维护者]

---

**最后更新**：2025年12月18日

**项目状态**：✅ 开发中 - 持续更新和改进
