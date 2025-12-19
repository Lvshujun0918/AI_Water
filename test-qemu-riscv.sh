#!/bin/bash
# Diagnostic script for QEMU RISC-V cross-compilation issues

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[diag]${NC} $*"; }
success() { echo -e "${GREEN}[diag]${NC} $*"; }
warning() { echo -e "${YELLOW}[diag]${NC} $*"; }
error() { echo -e "${RED}[diag][error]${NC} $*"; }

# Main diagnostics
main() {
  log "RISC-V Cross-Compilation Diagnostics"
  echo ""
  
  # 1. Check Docker
  log "1. Docker status"
  if command -v docker &>/dev/null; then
    success "Docker is installed: $(docker --version)"
  else
    error "Docker not found"
    return 1
  fi
  
  # 2. Check BuildKit
  log ""
  log "2. Docker BuildKit status"
  if docker buildx ls >/dev/null 2>&1; then
    success "BuildKit available"
    docker buildx ls | head -3
  else
    warning "BuildKit may not be available; install docker-buildx"
  fi
  
  # 3. Check current architecture
  log ""
  log "3. Current system architecture"
  local arch=$(uname -m)
  success "System arch: ${arch}"
  
  # 4. Check QEMU binfmt
  log ""
  log "4. QEMU binfmt handlers"
  if [ -d /proc/sys/fs/binfmt_misc ]; then
    if [ -f /proc/sys/fs/binfmt_misc/riscv64 ]; then
      success "RISC-V binfmt is registered"
      cat /proc/sys/fs/binfmt_misc/riscv64
    else
      warning "RISC-V binfmt not registered. Install with:"
      echo ""
      echo "  docker run --rm --privileged tonistiigi/binfmt:latest --install riscv64"
      echo ""
    fi
  else
    warning "binfmt_misc not available (non-Linux host or WSL)"
  fi
  
  # 5. Test Docker RISC-V platform
  log ""
  log "5. Testing riscv64 platform support"
  if docker run --rm --platform linux/riscv64 ubuntu:24.04 uname -m 2>/dev/null; then
    success "RISC-V platform test passed"
  else
    error "Cannot run riscv64 container"
    warning "Attempting to setup QEMU binfmt..."
    docker run --rm --privileged tonistiigi/binfmt:latest --install riscv64
    
    if docker run --rm --platform linux/riscv64 ubuntu:24.04 uname -m 2>/dev/null; then
      success "RISC-V now working after binfmt setup"
    else
      error "RISC-V still not working. Check Docker daemon logs."
      return 1
    fi
  fi
  
  # 6. Test shell compatibility
  log ""
  log "6. Testing riscv64 shell execution"
  if docker run --rm --platform linux/riscv64 ubuntu:24.04 /bin/bash -c "echo test" 2>/dev/null; then
    success "Shell execution test passed"
  else
    error "Shell execution failed in riscv64 container"
    warning "This may indicate QEMU emulation issues"
    return 1
  fi
  
  # 7. Docker info
  log ""
  log "7. Docker daemon configuration"
  docker info | grep -E "(Docker Version|OS|Architecture|Server Version|BuildKit)" || true
  
  echo ""
  success "Diagnostics complete!"
  echo ""
  echo "To build RISC-V wheels:"
  echo "  PLATFORM=riscv64 ./build-wheels-riscv.sh"
  echo ""
}

main "$@"
