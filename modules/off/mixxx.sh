#!/bin/bash

# Before start: chmod +x mixxx.sh
DB_PATH="$HOME/Library/Containers/org.mixxx.mixxx/Data/Library/Application Support/Mixxx/mixxxdb.sqlite"
URL="http://localhost:$1/data"
previous_id=""
while true; do
    if [ ! -f "$DB_PATH" ]; then
        break
    fi
    current_id=$(sqlite3 "$DB_PATH" "SELECT track_id FROM PlaylistTracks ORDER BY pl_datetime_added DESC LIMIT 1;")
    if [[ "$current_id" != "$previous_id" ]]; then
        artist=$(sqlite3 "$DB_PATH" "SELECT artist FROM library WHERE id = $current_id;")
        title=$(sqlite3 "$DB_PATH" "SELECT title FROM library WHERE id = $current_id;")
        genre=$(sqlite3 "$DB_PATH" "SELECT genre FROM library WHERE id = $current_id;")
        year=$(sqlite3 "$DB_PATH" "SELECT year FROM library WHERE id = $current_id;")
        curl -X POST -d "<artist>$artist</artist><title>$title</title><genre>$genre</genre><year>$year</year>" "$URL"
        previous_id="$current_id"
    fi
    sleep 4
done