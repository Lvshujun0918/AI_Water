mkdir -p /frp/

# 下载安装包
wget https://gh.llkk.cc/https://github.com/fatedier/frp/releases/download/v0.64.0/frp_0.64.0_linux_riscv64.tar.gz -O /frp/frp.tar.gz

# 解压文件
tar -zxvf /frp/frp.tar.gz -C /frp/

# 进入解压目录
cd /frp/frp_0.64.0_linux_riscv64

# 赋予可执行权限
chmod +x frpc

# 修改frpc.toml配置文件（根据实际情况修改）
cat > frpc.toml << EOF
serverAddr = "43.248.9.3"
serverPort = 7000
auth.token = "abc"

[[proxies]]
name = "ssh"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 6000
EOF

# 启动frpc客户端
./frpc -c ./frpc.toml &
