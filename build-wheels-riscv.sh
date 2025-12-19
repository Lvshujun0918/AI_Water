#!/bin/bash
set -euo pipefail

IMAGE_NAME=${IMAGE_NAME:-ai-water-wheels:riscv64}
OUTPUT_DIR=${OUTPUT_DIR:-"$(pwd)/whl/output"}
DOCKERFILE=${DOCKERFILE:-Dockerfile.whl}

log() { echo -e "[wheels] $*"; }

die() { echo "[wheels][error] $*" >&2; exit 1; }

# Preconditions
command -v docker >/dev/null 2>&1 || die "Docker is required." 

log "Output directory: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

log "Building image: $IMAGE_NAME"
docker build -f "$DOCKERFILE" -t "$IMAGE_NAME" .

log "Running image to collect wheels"
docker run --rm -v "$OUTPUT_DIR":/output "$IMAGE_NAME"

log "Wheels saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
