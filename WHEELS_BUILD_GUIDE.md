# PyTorch RISC-V 交叉编译 Wheel 构建指南

本脚本支持在 **RISC-V 设备** 和 **非 RISC-V 平台**（x86_64/AMD64）上构建 PyTorch、Vision、Audio wheels。

## 快速开始

### 前置要求

- Docker >= 20.10 (支持 `--platform` 标志)
- bash >= 4.0
- 足够的磁盘空间（build 可能占用 10-30GB）

### 在 RISC-V 设备上构建（原生）

```bash
chmod +x build-wheels-riscv.sh

# 默认构建，输出到 ./whl/output
./build-wheels-riscv.sh

# 或指定自定义输出目录
OUTPUT_DIR=/tmp/wheels ./build-wheels-riscv.sh
```

### 在 x86_64 上交叉编译 RISC-V wheels（QEMU 模拟）

```bash
chmod +x build-wheels-riscv.sh

# 指定目标平台为 RISC-V（自动使用 QEMU 模拟）
PLATFORM=riscv64 OUTPUT_DIR=/tmp/riscv-wheels ./build-wheels-riscv.sh
```

或在 AMD64 设备上：
```bash
# 显式指定交叉编译
PLATFORM=riscv64 ./build-wheels-riscv.sh
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PLATFORM` | 目标平台：`riscv64`、`amd64` 或 `auto`（自动检测） | `riscv64` |
| `OUTPUT_DIR` | wheels 输出目录 | `./whl/output` |
| `DOCKERFILE` | 构建文件路径 | `Dockerfile.whl` |
| `TARGET_ARCH` | RISC-V 目标三元组 | `riscv64-unknown-linux-gnu` |

## 使用示例

### 示例 1：在 RISC-V 设备上原生编译

```bash
./build-wheels-riscv.sh
```

输出：
```
[wheels] PyTorch RISC-V/Cross-platform Wheel Builder

[wheels] Target platform: riscv64
[wheels] Building riscv64 wheel image: ai-water-wheels:riscv64
...
[wheels] Wheels saved to: ./whl/output
[wheels] Output directory: ./whl/output
[wheels] Files:
  torch-... (245.3M)
  torchaudio-... (12.5M)
  torchvision-... (45.2M)
...
```

### 示例 2：在 x86_64 上交叉编译 RISC-V

```bash
PLATFORM=riscv64 OUTPUT_DIR=/mnt/shared/riscv-wheels ./build-wheels-riscv.sh
```

脚本会：
1. 检查 Docker 是否支持 RISC-V 模拟
2. 使用 `--platform linux/riscv64` 构建镜像（触发 QEMU 模拟）
3. 运行容器并收集 wheels 到指定目录

### 示例 3：自动检测平台

```bash
PLATFORM=auto ./build-wheels-riscv.sh
```

脚本自动检测当前系统架构：
- 若为 `riscv64`：原生编译
- 若为 `x86_64/amd64`：自动设置为 `amd64`（原生编译）

## 构建产物

编译完成后，输出目录包含：

```
whl/output/
├── torch-2.x.x-cp312-...-linux_riscv64.whl  (PyTorch 核心)
├── torchaudio-2.x.x-cp312-...-linux_riscv64.whl
├── torchvision-0.x.x-cp312-...-linux_riscv64.whl
└── *.whl  (其他依赖)
```

## 性能与时间

| 场景 | 时间估计 | 备注 |
|------|---------|------|
| RISC-V 原生编译 | 2-6 小时 | 取决于硬件 |
| x86_64 QEMU 模拟 | 4-12 小时 | QEMU 增加 2-3x 开销 |
| 增量构建 | 15-30 分钟 | Docker 缓存可加速 |

### 优化构建速度

1. **多核并行**（已配置）：脚本默认使用 `MAX_CONCURRENCY=64` 并行构建
2. **Docker 缓存**：保留镜像避免重复构建
   ```bash
   # 仅重建（使用缓存）
   PLATFORM=riscv64 ./build-wheels-riscv.sh
   ```
3. **本地 Docker daemon**：避免远程 Docker 连接开销

## 故障排查

### 问题 1：QEMU 模拟不可用

```
Error: QEMU RISC-V binfmt not detected
```

**解决**：
```bash
# 在 Linux 上启用 QEMU binfmt
docker run --rm --privileged tonistiigi/binfmt --install riscv64

# 重试构建
PLATFORM=riscv64 ./build-wheels-riscv.sh
```

### 问题 2：磁盘空间不足

```
Error: No space left on device
```

**解决**：
```bash
# 清理 Docker 镜像和容器
docker system prune -a

# 增加可用空间或指定外部目录
OUTPUT_DIR=/mnt/large-disk/wheels ./build-wheels-riscv.sh
```

### 问题 3：构建超时

**解决**：
- 增加 Docker 构建超时：
  ```bash
  export DOCKER_BUILDKIT_PROGRESS=plain
  PLATFORM=riscv64 ./build-wheels-riscv.sh
  ```
- 或分开构建（编辑 `Dockerfile.whl`，注释不需要的部分）

### 问题 4：权限错误

```
permission denied: /output
```

**解决**：
```bash
# 确保输出目录可写
mkdir -p "${OUTPUT_DIR}"
chmod 777 "${OUTPUT_DIR}"

./build-wheels-riscv.sh
```

## 集成到 CI/CD

### GitHub Actions 示例

```yaml
name: Build RISC-V Wheels

on: [push, workflow_dispatch]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2
        with:
          platforms: riscv64
      
      - name: Build wheels
        run: |
          PLATFORM=riscv64 OUTPUT_DIR=./wheels ./build-wheels-riscv.sh
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: riscv64-wheels
          path: ./wheels/*.whl
```

## 脚本参数详解

### `PLATFORM`

指定目标编译平台：
- `riscv64`：编译 RISC-V 64-bit wheels
- `amd64`：编译 AMD64/x86_64 wheels（原生或交叉）
- `auto`：自动检测当前架构

### `OUTPUT_DIR`

wheels 输出目录。脚本会自动创建。

示例：
```bash
OUTPUT_DIR=/opt/wheels ./build-wheels-riscv.sh
```

### `DOCKERFILE`

自定义 Dockerfile 路径，默认为 `Dockerfile.whl`。

用途：
- 不同配置的 Dockerfile
- 自定义构建参数

示例：
```bash
DOCKERFILE=Dockerfile.whl.custom ./build-wheels-riscv.sh
```

## Dockerfile 定制

若需自定义构建，编辑 `Dockerfile.whl`：

```dockerfile
# 修改构建并发数
ENV MAX_CONCURRENCY=32

# 跳过某些库的构建
# RUN echo "Skipping audio build..."

# 添加自定义依赖
RUN pip install custom-package
```

## 许可与致谢

- PyTorch、Vision、Audio：各自的开源许可（BSD-3-Clause）
- 本脚本：MIT License

## 联系与支持

- Issue：[GitHub Issues](https://github.com/Lvshujun0918/AI_Water/issues)
- 讨论：[GitHub Discussions](https://github.com/Lvshujun0918/AI_Water/discussions)

---

**最后更新**：2025年12月20日
