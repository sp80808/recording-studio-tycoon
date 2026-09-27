#!/usr/bin/env bash
# Quick shell wrapper for clean-appledouble.py
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$DIR/scripts/clean-appledouble.py" "$@"
