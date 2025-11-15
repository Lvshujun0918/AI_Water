# 使用官方Node.js运行时作为父镜像
FROM node:16-bullseye

# 设置工作目录
WORKDIR /app

# 安装Python和相关依赖
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 创建软链接，使python命令指向python3
RUN ln -s /usr/bin/python3 /usr/bin/python

# 设置Python环境变量
ENV PYTHONUNBUFFERED=1

# 复制项目文件
COPY . .

# 安装Python依赖
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip3 install macls -U -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装根目录依赖
RUN npm install

# 安装前端依赖并构建
RUN cd frontend && npm install && npm run build

# 安装后端依赖
RUN cd backend && npm install

# 暴露端口
EXPOSE 3000
EXPOSE 8080

# 创建上传目录
RUN mkdir -p backend/uploads

# 启动应用
CMD ["npm", "run", "dev"]