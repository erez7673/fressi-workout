#!/bin/bash
# Usage: bounce.sh <half.mp4> <out.mp4> <check.png>
# half.mp4 runs top -> bottom of the rep (4 s). Output: the same at 2x speed, then reversed = one full 4 s rep
# that starts and ends on the top still. check.png = start | middle over start | bottom over start, so any
# camera drift or body stretch shows up as a double image of the body/bench.
set -e
in="$1"; out="$2"; chk="$3"
ffmpeg -nostdin -loglevel error -y -i "$in" -filter_complex \
  "[0:v]setpts=0.5*PTS,split[f][r0];[r0]reverse[r];[f][r]concat=n=2:v=1:a=0[v]" -map "[v]" -an -r 24 "$out"
n=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$in")
t=$(mktemp -d)
for k in 0 $((n/2)) $((n-1)); do
  ffmpeg -nostdin -loglevel error -y -i "$in" -vf "select='eq(n\,$k)',scale=320:320" -fps_mode passthrough -frames:v 1 "$t/f$k.png"
done
ffmpeg -nostdin -loglevel error -y -i "$t/f0.png" -i "$t/f$((n/2)).png" -i "$t/f$((n-1)).png" -filter_complex \
  "[0]split=3[s0][s1][s2];[s1][1]blend=all_mode=average[om];[s2][2]blend=all_mode=average[ol];[s0][om][ol]hstack=3" "$chk"
rm -rf "$t"
