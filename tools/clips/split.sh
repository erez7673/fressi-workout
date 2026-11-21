#!/bin/bash
# Usage: split.sh <pair.png> <outprefix> -> <outprefix>-a.png (left half) <outprefix>-b.png (right half), square-cropped,
# plus <outprefix>-ov.png (a | b | 50% overlay)
set -e
p="$1"; o="$2"
dims=$(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$p" | tr -d '\r')
w=${dims%,*}; h=${dims#*,}
hw=$((w/2)); s=$(( hw < h ? hw : h ))
ffmpeg -nostdin -loglevel error -y -i "$p" -vf "crop=$s:$s:$(( (hw-s)/2 )):$(( (h-s)/2 ))" "$o-a.png"
ffmpeg -nostdin -loglevel error -y -i "$p" -vf "crop=$s:$s:$(( hw + (hw-s)/2 )):$(( (h-s)/2 ))" "$o-b.png"
ffmpeg -nostdin -loglevel error -y -i "$o-a.png" -i "$o-b.png" -filter_complex "[0]scale=320:320,split[a][a2];[1]scale=320:320,split[b][b2];[a2][b2]blend=all_mode=average[m];[a][b][m]hstack=3" "$o-ov.png"
