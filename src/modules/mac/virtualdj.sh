#!/bin/bash

# Before start: chmod +x virtualdj.sh
# VirtualDJ settings
# savePlaylist: yes
# tracklistFormat: <artist>%author</artist><title>%title</title><genre>%genre</genre>
FILE_TO_WATCH="$HOME/Library/Application Support/VirtualDJ/History/tracklist.txt"
URL="http://localhost:$1/data"
previous_content=""
while true; do
    if [ ! -f "$FILE_TO_WATCH" ]; then
        sleep 10
        continue
    fi
    current_content=$(tail -1 "$FILE_TO_WATCH")
    if [[ "$current_content" != "$previous_content" ]]; then
        curl -X POST -d "<player>VirtualDJ</player>$current_content" "$URL"
        previous_content="$current_content"
    fi
    sleep 4
done