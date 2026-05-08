#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
cp -r src/* dist/
cp ../../packages/eigen-form/src/eigen-form.js dist/
cp ../../packages/brand-tokens/colors_and_type.css dist/
echo "build complete: $(ls dist/ | tr '\n' ' ')"
