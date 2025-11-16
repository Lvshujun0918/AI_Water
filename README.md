# AI智慧水务检漏系统

基于 Element UI 和 Vue3 构建的水务管网漏水音频识别后台管理系统，用于管理和分析上传的音频文件，及时发现漏水点，解放人类手动检测的耗时和误差。系统使用机器学习模型对音频进行分类和风险评估。

## 项目截图
<img width="2550" height="2480" alt="image" src="https://github.com/user-attachments/assets/d73a9274-dea6-4e46-aef2-9cdfaa044c22" />
<img width="2196" height="673" alt="image" src="https://github.com/user-attachments/assets/bd057d34-7ff2-4202-9dec-fd7cb5716d38" />
<img width="2166" height="1118" alt="image" src="https://github.com/user-attachments/assets/8bf340dc-35ec-4e07-90e0-365b2f84ed62" />
<img width="513" height="618" alt="image" src="https://github.com/user-attachments/assets/fbc9c861-6ea3-4be8-96eb-26d273f060f9" />

## 项目概述

这是一个前后端分离的管理系统，前端使用 Vue3 + Element Plus 构建用户界面，后端使用 Node.js + Express 提供 API 服务，并通过 Python 机器学习模型进行音频分类识别。

### 主要功能

- 用户认证和权限管理
- 音频文件上传和管理
- 基于 AI 模型的音频风险评估
- 数据可视化展示
- 系统初始化和管理员设置

## 技术架构

### 前端技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Element Plus - Vue 3 组件库
- Vue Router - 路由管理
- Axios - HTTP 客户端
- ECharts - 数据可视化
- Vite - 构建工具

### 后端技术栈

- Node.js - JavaScript 运行时
- Express - Web 应用框架
- SQLite - 轻量级数据库
- BCrypt - 密码加密
- JWT - JSON Web Token 认证
- Multer - 文件上传处理
- Python Shell - Python 脚本执行

### Python 依赖

- PyTorch - 机器学习框架
- macls - 音频分类库
- numpy, scipy 等科学计算库

## 环境要求

### 基础环境

- Node.js >= 14.x
- Python >= 3.8
- npm >= 6.x

### Python 环境配置

```bash
# 安装 PyTorch (根据您的 CUDA 版本选择合适的安装命令)
# 无 CUDA 支持:
pip3 install torch torchvision torchaudio

# 或者使用 conda 安装:
# conda install pytorch torchvision torchaudio cpuonly -c pytorch

# 安装 macls 音频分类库
pip install macls -U -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或者从源码安装以获取最新功能
git clone https://github.com/yeyupiaoling/AudioClassification-Pytorch.git
cd AudioClassification-Pytorch/
pip install .
```

## 安装和启动

### 1. 克隆项目

```bash
git clone https://github.com/Lvshujun0918/AI_Water
cd AI_Water
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..

# 安装后端依赖
cd backend
npm install
cd ..
```

### 3. 启动项目

#### 开发环境一键启动

```bash
npm run dev
```

这将同时启动前端和后端服务:
- 前端运行在 http://localhost:8080
- 后端 API 服务运行在 http://localhost:3000

#### 分别启动服务

```bash
# 启动后端服务
npm run dev:backend

# 启动前端服务
npm run dev:frontend
```

#### 生产环境构建

```bash
# 构建前端项目
npm run build
```

## 项目结构

```
.
├── backend                 # 后端代码
│   ├── py                  # Python 音频识别模型
│   │   ├── config          # 模型配置文件
│   │   └── predict.py      # 预测脚本
│   ├── uploads             # 上传文件目录
│   ├── utils               # 工具函数
│   ├── server.js           # 主服务文件
│   └── ...
├── frontend                # 前端代码
│   ├── src                 # 源代码
│   │   ├── components      # 组件
│   │   ├── views           # 页面视图
│   │   ├── router          # 路由配置
│   │   ├── config          # 配置文件
│   │   └── ...
│   └── ...
├── package.json            # 根目录配置
└── README.md               # 项目说明文件
```

## API 接口

主要 API 接口包括：

- `/api/init-status` - 检查系统初始化状态
- `/api/init-admin` - 初始化管理员账户
- `/api/login` - 用户登录
- `/api/upload-audio` - 音频文件上传
- `/api/audio-files` - 获取音频文件列表

更多接口详情请查看 [backend/server.js](backend/server.js) 文件。

## 许可证

本项目采用 MIT 许可证，详细信息请查看 [LICENSE](LICENSE) 文件。

### 第三方依赖许可证

#### 前端依赖

| 包名 | 许可证 | 链接 |
|------|--------|------|
| vue | MIT | https://github.com/vuejs/core |
| element-plus | MIT | https://github.com/element-plus/element-plus |
| vue-router | MIT | https://github.com/vuejs/router |
| axios | MIT | https://github.com/axios/axios |
| echarts | Apache-2.0 | https://github.com/apache/echarts |
| vue-echarts | MIT | https://github.com/ecomfe/vue-echarts |

#### 后端依赖

| 包名 | 许可证 | 链接 |
|------|--------|------|
| express | MIT | https://github.com/expressjs/express |
| sqlite3 | BSD-3-Clause | https://github.com/TryGhost/node-sqlite3 |
| bcrypt | MIT | https://github.com/kelektiv/node.bcrypt.js |
| jsonwebtoken | MIT | https://github.com/auth0/node-jsonwebtoken |
| multer | MIT | https://github.com/expressjs/multer |
| python-shell | MIT | https://github.com/extrabacon/python-shell |
| cors | MIT | https://github.com/expressjs/cors |
| body-parser | MIT | https://github.com/expressjs/body-parser |

#### Python 依赖

| 包名 | 许可证 | 链接 |
|------|--------|------|
| torch (PyTorch) | BSD-3-Clause | https://github.com/pytorch/pytorch |
| macls | Apache-2.0 | https://github.com/yeyupiaoling/AudioClassification-Pytorch |

## 使用说明

1. 首次运行系统时，访问 http://localhost:8080 进入初始化页面，创建管理员账户
2. 初始化完成后，使用管理员账户登录系统
3. 在上传页面上传音频文件进行风险评估
4. 在记录页面查看历史上传记录和分析结果

## 注意事项

1. 确保已正确安装 Python 环境和相关依赖包
2. 音频文件大小限制为 50MB
3. 系统仅支持音频文件上传（如 .mp3, .wav 等格式）
4. 首次运行需要网络连接以下载模型依赖

## 贡献

欢迎提交 Issue 和 Pull Request 来改进本项目。
