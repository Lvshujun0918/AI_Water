#!/bin/bash
set -euo pipefail

# Configuration
DOCKERFILE=${DOCKERFILE:-Dockerfile.whl}
OUTPUT_DIR=${OUTPUT_DIR:-"$(pwd)/whl/output"}
PLATFORM=${PLATFORM:-riscv64}  # riscv64 or amd64 (native)
TARGET_ARCH=${TARGET_ARCH:-riscv64-unknown-linux-gnu}  # RISC-V target triple

# Derived variables
IMAGE_TAG="ai-water-wheels:${PLATFORM}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() { echo -e "${BLUE}[wheels]${NC} $*"; }
log_success() { echo -e "${GREEN}[wheels]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[wheels]${NC} $*"; }
log_error() { echo -e "${RED}[wheels][error]${NC} $*" >&2; }

die() { log_error "$@"; exit 1; }

# Detect platform
detect_platform() {
  if [[ "${PLATFORM}" == "auto" ]]; then
    local arch=$(uname -m)
    case "$arch" in
      riscv64)   PLATFORM="riscv64" ;;
      x86_64|amd64) PLATFORM="amd64" ;;
      *)  die "Unsupported platform: $arch. Set PLATFORM=riscv64|amd64 explicitly." ;;
    esac
  fi
  log "Target platform: ${PLATFORM}"
}

# Check prerequisites
check_prerequisites() {
  command -v docker >/dev/null 2>&1 || die "Docker is required."
  
  if [[ "${PLATFORM}" == "riscv64" && "$(uname -m)" != "riscv64" ]]; then
    log_warning "Cross-compiling RISC-V on non-RISC-V host (requires QEMU binfmt support)"
    if ! docker run --rm --platform linux/riscv64 busybox:latest true >/dev/null 2>&1; then
      log_warning "QEMU RISC-V binfmt not detected; Docker buildx may use emulation."
    fi
  fi
}

# Build image
build_image() {
  log "Building ${PLATFORM} wheel image: ${IMAGE_TAG}"
  
  if [[ "${PLATFORM}" == "riscv64" ]]; then
    # Use explicit platform for cross-compilation
    docker build \
      --platform linux/riscv64 \
      -f "${DOCKERFILE}" \
      -t "${IMAGE_TAG}" \
      --progress=plain \
      . || die "Build failed"
  else
    # Native build
    docker build \
      -f "${DOCKERFILE}" \
      -t "${IMAGE_TAG}" \
      --progress=plain \
      . || die "Build failed"
  fi
  
  log_success "Image built: ${IMAGE_TAG}"
}

# Run image and collect wheels
collect_wheels() {
  log "Running container to collect wheels..."
  
  mkdir -p "${OUTPUT_DIR}"
  
  if [[ "${PLATFORM}" == "riscv64" ]]; then
    docker run --rm \
      --platform linux/riscv64 \
      -v "${OUTPUT_DIR}":/output \
      "${IMAGE_TAG}" \
      || die "Container run failed"
  else
    docker run --rm \
      -v "${OUTPUT_DIR}":/output \
      "${IMAGE_TAG}" \
      || die "Container run failed"
  fi
  
  log_success "Wheels saved to: ${OUTPUT_DIR}"
}

# Summary
print_summary() {
  echo ""
  log_success "Build complete!"
  echo ""
  log "Output directory: ${OUTPUT_DIR}"
  log "Files:"
  
  if [[ -d "${OUTPUT_DIR}" ]]; then
    ls -lh "${OUTPUT_DIR}" | tail -n +2 | awk '{print "  " $9 " (" $5 ")"}'
    local count=$(find "${OUTPUT_DIR}" -maxdepth 1 -name "*.whl" | wc -l)
    log_success "Total wheels: ${count}"
  else
    log_warning "Output directory not found or empty"
  fi
  echo ""
}

# Main
main() {
  log "PyTorch RISC-V/Cross-platform Wheel Builder"
  echo ""
  
  detect_platform
  check_prerequisites
  build_image
  collect_wheels
  print_summary
}

main "$@"
