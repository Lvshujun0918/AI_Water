#!/bin/sh

# 自动修复uploads权限（对宿主机目录有效）
chmod -R 777 /app/backend/uploads 2>/dev/null || true

# 如果有 users.db，也顺便修权限（可选）
if [ -f /app/backend/users.db ]; then
    chmod 666 /app/backend/users.db 2>/dev/null || true
fi

exec "$@"