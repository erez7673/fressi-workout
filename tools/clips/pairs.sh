#!/bin/bash
# Usage: pairs.sh <topdir> <botdir> <out.png> idx...  -> rows of: top | bottom | 50% overlay (each 256px)
set -e
t="$1"; b="$2"; o="$3"; shift 3; tmp=$(mktemp -d); rows=()
for i in "$@"; do
  ffmpeg -nostdin -loglevel error -y -i "$t/$i.img" -i "$b/$i.img" -filter_complex "[0]scale=256:256,split[a][a2];[1]scale=256:256,split[c][c2];[a2][c2]blend=all_mode=average[m];[a][c][m]hstack=3" "$tmp/r$i.png"
  rows+=(-i "$tmp/r$i.png")
done
n=$(( ${#rows[@]} / 2 ))
if [ $n -gt 1 ]; then ffmpeg -nostdin -loglevel error -y "${rows[@]}" -filter_complex "vstack=inputs=$n" "$o"; else cp "$tmp/r$1.png" "$o"; fi
rm -rf "$tmp"
