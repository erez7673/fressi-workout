#!/bin/bash
# Usage: grab.sh <outdir> <name=url> ...  -> downloads each mp4 as <name>.mp4, makes <name>.png (8-frame strip)
# and stacks all strips into <outdir>/strips.png
set -e
out="$1"; shift
mkdir -p "$out"
list=()
for kv in "$@"; do
  n="${kv%%=*}"; u="${kv#*=}"
  curl -s -o "$out/$n.mp4" "$u"
  ffmpeg -nostdin -loglevel error -y -i "$out/$n.mp4" -vf "select='not(mod(n\,12))',scale=160:160,tile=8x1" -fps_mode passthrough -frames:v 1 "$out/$n.png"
  list+=("$out/$n.png")
done
args=(); for p in "${list[@]}"; do args+=(-i "$p"); done
if [ ${#list[@]} -gt 1 ]; then
  ffmpeg -nostdin -loglevel error -y "${args[@]}" -filter_complex "vstack=inputs=${#list[@]}" "$out/strips.png"
else
  cp "${list[0]}" "$out/strips.png"
fi
echo done
