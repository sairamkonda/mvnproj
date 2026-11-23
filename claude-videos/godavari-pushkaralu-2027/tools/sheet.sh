#!/bin/bash
# contact sheet: tools/sheet.sh out.jpg in1.jpg in2.jpg ...
out=$1; shift
n=$#; cols=${COLS:-6}; rows=$(( (n + cols - 1) / cols ))
ffmpeg -y -loglevel error $(for f in "$@"; do echo -i "$f"; done) -filter_complex "$(for i in $(seq 0 $((n-1))); do echo -n "[$i:v]scale=360:640[v$i];"; done)$(for i in $(seq 0 $((n-1))); do echo -n "[v$i]"; done)xstack=inputs=$n:layout=$(for i in $(seq 0 $((n-1))); do echo -n "$(( (i % cols) * 360 ))_$(( (i / cols) * 640 ))|"; done | sed 's/|$//'):fill=black" -frames:v 1 -q:v 3 "$out"
