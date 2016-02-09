import subprocess
import sys

from time import sleep
from os   import path

filename = path.realpath(path.dirname(sys.argv[0])) + "/" + "NowPlaying.txt"
previousTrackID = ""

def saveData(data):
	global filename
	datafile = open(filename, "w")
	datafile.write(data)
	datafile.close()

def getData():
	data = []
	data.append(subprocess.check_output(["deadbeef", "--nowplaying", "Artist: %a"]))
	data.append(subprocess.check_output(["deadbeef", "--nowplaying", "Title: %t"]))
	return "\n".join(data)

def getTrackID():
	return subprocess.check_output(["deadbeef", "--nowplaying", "%F"])

try:
	while True:
		nowTrackID = getTrackID()
		if nowTrackID != previousTrackID and nowTrackID != "nothing":
			previousTrackID = nowTrackID
			data = getData()
			saveData(data)
		sleep(4)
except KeyboardInterrupt:
	sys.exit(1);


