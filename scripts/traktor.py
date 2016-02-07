import socket
import re
import sys
from os import path
from struct import unpack

filename = path.realpath(path.dirname(sys.argv[0])) + '/' + 'NowPlaying.txt'
meta = { 'title': None, 'artist': None }
data = ''

def saveData():
    global filename
    global meta
    metaData = "Title: " + meta['title'] + "\nArtist: " + meta['artist']
    datafile = open(filename, 'w')
    datafile.write(metaData)
    datafile.close()

def getName(needle, haystack):
    regmatch = '(....)' + needle.upper() + '=(.*)'
    name = re.search(regmatch.encode('utf-8'), haystack)
    if name:
        length = unpack('=l', name.group(1))[0]
        length = length - len(needle) - 1
        if len(name.group(2)) >= length:
            return (name.group(2))[0:length]
    return None

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('localhost', 8000))
sock.listen(1)
conn, addr = sock.accept()
print 'Connected:', addr

while True:
    dataNew = conn.recv(4096)
    if not dataNew:
        break
    data += dataNew
    if data.find('ice') != -1:
        conn.sendall("HTTP/1.0 200 OK\r\n\r\n")
        data = ''
        continue
    meta['artist'] = getName('artist', data)
    meta['title'] = getName('title', data)
    if meta['artist'] is not None and meta['title'] is not None:
        saveData()
        print meta['artist'], "-", meta['title']
        meta['artist'] = None
        meta['title'] = None
        dataNew = ''
    data = dataNew

conn.close()
