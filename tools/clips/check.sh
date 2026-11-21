#!/bin/bash
# Usage: check.sh <dir> <name=url> ...
# For each clip: downloads <dir>/<name>.mp4, builds the bounce loop <dir>/<name>-loop.mp4 (bounce.sh) and a review
# row <dir>/<name>-row.png (6-frame strip | start, mid-over-start, end-over-start), and prints how different the
# start, middle and end frames are (start-end small = the video is already a full rep: use it as the loop as-is).
# All rows are stacked into <dir>/rows.png.
set -e
d="$1"; shift; h=$(cd "$(dirname "$0")" && pwd); rows=()
for kv in "$@"; do
  n="${kv%%=*}"; u="${kv#*=}"
  curl -s -o "$d/$n.mp4" "$u"
  bash "$h/bounce.sh" "$d/$n.mp4" "$d/$n-loop.mp4" "$d/$n-chk.png"
  ffmpeg -nostdin -loglevel error -y -i "$d/$n.mp4" -vf "select='not(mod(n\,19))',scale=160:160,tile=6x1" -frames:v 1 "$d/$n-s.png"
  ffmpeg -nostdin -loglevel error -y -i "$d/$n-s.png" -i "$d/$n-chk.png" -filter_complex "[1]scale=480:160[c];[0][c]hstack" "$d/$n-row.png"
  python -I - "$d/$n.mp4" <<'EOF'
import sys, subprocess, numpy as np
p = sys.argv[1]
o = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', p, '-vf', "select='eq(n,0)+eq(n,48)+eq(n,96)',scale=96:96,format=gray",
                    '-fps_mode', 'passthrough', '-f', 'rawvideo', '-'], capture_output=True).stdout
a = np.frombuffer(o, np.uint8).reshape(-1, 96, 96).astype(float)
print('%-14s start-mid %4.1f  start-end %4.1f  mid-end %4.1f' % (p.rsplit('/', 1)[-1], abs(a[0]-a[1]).mean(), abs(a[0]-a[2]).mean(), abs(a[1]-a[2]).mean()))
EOF
  rows+=(-i "$d/$n-row.png")
done
k=$(( ${#rows[@]} / 2 ))
if [ $k -gt 1 ]; then ffmpeg -nostdin -loglevel error -y "${rows[@]}" -filter_complex "vstack=inputs=$k" "$d/rows.png"; else cp "$d/$n-row.png" "$d/rows.png"; fi
