#!/bin/bash
set -e

# 仅当以 root 身份运行时，才修正权限并切换用户
if [ "$(id -u)" = "0" ]; then
  # 修正挂载目录和文件权限（只有root可以修改）
  chmod -R 777 /app/backend/uploads 2>/dev/null || true
  chmod 666 /app/backend/users.db 2>/dev/null || true
  echo "Permissions for /app/backend/uploads and /app/backend/users.db have been set."
  
  # 以 appuser (UID 1000) 身份执行后续命令
  exec su-exec appuser "$@"
else
  # 非 root 身份直接执行
  exec "$@"
fi