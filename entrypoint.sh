#!/bin/bash
# 修正挂载目录和文件权限
chmod -R 777 /app/backend/uploads
chmod 666 /app/backend/users.db
echo "Permissions for /app/backend/uploads and /app/backend/users.db have been set."
# ...原有 entrypoint.sh 内容...
exec "$@"