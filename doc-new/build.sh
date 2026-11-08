#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# 中文论文使用 XeLaTeX；三遍编译以稳定浮动体、交叉引用与页码。
xelatex -interaction=nonstopmode -halt-on-error AI_Water_K1_技术文档.tex
xelatex -interaction=nonstopmode -halt-on-error AI_Water_K1_技术文档.tex
xelatex -interaction=nonstopmode -halt-on-error AI_Water_K1_技术文档.tex
