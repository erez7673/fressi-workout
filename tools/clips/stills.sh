#!/bin/bash
# Usage: stills.sh <outdir> <name=url> ... -> downloads pngs as <name>.img and builds <outdir>/sheet.png
set -e
out="$1"; shift; mkdir -p "$out"
for kv in "$@"; do n="${kv%%=*}"; u="${kv#*=}"; curl -s -o "$out/$n.img" "$u"; done
d=$(cd "$(dirname "$0")" && pwd)
(cd "$out" && python -I "$d/sheet.py" . >/dev/null && mv sheet1.png sheet.png); echo done
