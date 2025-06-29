#!/bin/bash

# Before start: chmod +x djay.sh
FILE_TO_WATCH="$HOME/Music/djay/djay Media Library.djayMediaLibrary/NowPlaying.txt"
URL="http://localhost:$1/data"
previous_content=""
while true; do
    if [ ! -f "$FILE_TO_WATCH" ]; then
        sleep 10
        continue
    fi
    current_content=$(cat "$FILE_TO_WATCH")
    if [[ "$current_content" != "$previous_content" ]]; then
        curl -X POST -d "$current_content" "$URL"
        previous_content="$current_content"
    fi
    sleep 4
done