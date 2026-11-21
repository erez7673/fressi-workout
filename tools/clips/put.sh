#!/bin/bash
# Usage: put.sh <media_upload result json> <dir> name1 name2 ...  (names without .png, same order as the upload request)
set -e
f="$1"; d="$2"; shift 2; names=("$@")
python -I -c "
import json,sys
for x in json.load(open(sys.argv[1],encoding='utf8'))['uploads']: print(x['media_id'], x['upload_url'])
" "$f" | tr -d '\r' > "$d/urls.txt"
k=0; while read id url; do n=${names[$k]}; code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Content-Type: image/png" --data-binary @"$d/$n.png" "$url"); echo "$n $id $code"; k=$((k+1)); done < "$d/urls.txt"
