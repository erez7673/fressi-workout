#!/bin/bash
# Usage: enc.sh <src.mp4> <dest-basename e.g. db-lateral-m>  -> encodes into docs/media/anim
set -e
D="$(cd "$(dirname "$0")/../.." && pwd)/docs/media/anim"
T=$(dirname "$0")/enc; mkdir -p "$T"
ffmpeg -nostdin -loglevel error -y -i "$1" -an -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 23 -preset slow -vf scale=480:480 -movflags +faststart "$T/$2.mp4"
ffmpeg -nostdin -loglevel error -y -i "$T/$2.mp4" -frames:v 1 -q:v 6 "$T/$2.jpg"
cp "$T/$2.mp4" "$T/$2.jpg" "$D/"
