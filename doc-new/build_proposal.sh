#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

NAME="AI_Water_K1_方案书"

xelatex -interaction=nonstopmode -halt-on-error "${NAME}.tex"
biber "${NAME}"
xelatex -interaction=nonstopmode -halt-on-error "${NAME}.tex"
xelatex -interaction=nonstopmode -halt-on-error "${NAME}.tex"
