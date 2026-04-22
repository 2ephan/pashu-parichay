#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
echo "Starting PashuParichay (one-click mode)..."
npm run one-click
