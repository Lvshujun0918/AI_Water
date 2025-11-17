#!/bin/bash

# 输出构建时间和版本信息
echo "-----------------------------------"
echo "AI-Water Starting application..."
echo "Build Time: ${BUILD_TIME}"
echo "Version: ${VERSION}"
echo "Git Commit: ${GIT_COMMIT}"
echo "Author: lvshujun"
echo "-----------------------------------"

# 加载环境变量
if [ -f ./backend/.env ]; then
  export $(cat ./backend/.env | xargs)
fi

# 启动后端服务和nginx
node ./backend/server.js & nginx -g 'daemon off;'