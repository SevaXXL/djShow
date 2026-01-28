#!/usr/bin/env python3

import sys
import time
import json
import requests
import dbus
from dbus.exceptions import DBusException

# Server URL for POST request
POST_URL = f"http://localhost:{sys.argv[1]}/data"

# Poll interval in seconds
POLL_INTERVAL = 4

# Store previous track ID (for internal comparison only)
prev_track_id = None


def get_strawberry_metadata():
    """
    Fetches current track metadata from Strawberry via D-Bus.
    Returns dict with track data (without 'id' in output), or None if unavailable.
    """
    try:
        bus = dbus.SessionBus()

        if not bus.name_has_owner('org.mpris.MediaPlayer2.strawberry'):
            print("[STATUS] Strawberry is not running (D-Bus service unavailable)")
            return None

        player = bus.get_object(
            'org.mpris.MediaPlayer2.strawberry',
            '/org/mpris/MediaPlayer2'
        )

        interface = dbus.Interface(player, 'org.freedesktop.DBus.Properties')
        metadata = interface.Get('org.mpris.MediaPlayer2.Player', 'Metadata')

        # Extract fields (id is used only for comparison, not returned)
        title = str(metadata.get('xesam:title', ''))
        artist_list = metadata.get('xesam:artist', [])
        artist = ', '.join(str(a) for a in artist_list) if artist_list else ''
        year = metadata.get('xesam:year', 0)
        genre_list = metadata.get('xesam:genre', [])
        genre = ', '.join(str(g) for g in genre_list) if genre_list else ''
        track_id = str(metadata.get('mpris:trackid', ''))  # Keep for comparison

        return {
            'title': title,
            'artist': artist,
            'year': int(year) if year else None,
            'genre': genre,
            'id': track_id  # Will be stripped before sending
        }

    except DBusException as e:
        print(f"[DBUS ERROR] D-Bus communication failed: {e}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return None



def is_new_track(new_meta):
    """
    Checks if the current track is new by comparing its ID with the previous one.
    Returns True only if IDs differ (or if there was no previous track).
    """
    global prev_track_id
    if new_meta is None:
        return False

    current_id = new_meta['id']
    
    if prev_track_id is None or current_id != prev_track_id:
        prev_track_id = current_id
        return True
    return False



def send_post_data(data):
    """
    Sends data to the server via POST in JSON format:
    { "current": { ... } } — WITHOUT 'id' field
    """
    # Remove 'id' from the payload
    safe_data = {k: v for k, v in data.items() if k != 'id'}
    
    payload = {
        "current": safe_data
    }

    try:
        response = requests.post(POST_URL, json=payload, timeout=5)
        if response.status_code == 200:
            print(f"[INFO] Data sent successfully: {json.dumps(payload, ensure_ascii=False)}")
        else:
            print(f"[WARNING] Server responded with status {response.status_code}: {response.text}")
    except requests.RequestException as e:
        print(f"[ERROR] POST request failed: {e}")



def main():
    print("[INFO] Strawberry monitor started. Waiting for Strawberry to appear...")

    while True:
        metadata = get_strawberry_metadata()

        if metadata is not None:
            if is_new_track(metadata):
                # Log with ID (for debugging), but don't send it
                print(f"[CHANGE] New track detected (ID: {metadata['id']}): {metadata['title']} by {metadata['artist']}")
                send_post_data(metadata)
        else:
            pass  # Strawberry not running or error

        time.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    main()

