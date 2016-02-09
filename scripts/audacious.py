import dbus
import dbus.mainloop.glib
import gobject
import sys
from os import path

filename = path.realpath(path.dirname(sys.argv[0])) + '/' + 'NowPlaying.txt'

def parseMeta(meta):
	data = []
	if 'title' in meta:
		data.append('Title: ' + meta['title'])
	if 'artist' in meta:
		data.append('Artist: ' + meta['artist'])
	return "\n".join(data)

def trackChanged(data):
	saveData()

def saveData():
	global iface
	global filename
	status = iface.GetStatus()
	if status[0] == 0:
		meta = iface.GetMetadata()
		data = parseMeta(meta)
		datafile = open(filename, 'w')
		datafile.write(data.encode('utf-8'))
		datafile.close()

dbus.mainloop.glib.DBusGMainLoop(set_as_default = True)
session_bus = dbus.SessionBus()
try:
	player = session_bus.get_object('org.mpris.audacious', '/Player')
	iface = dbus.Interface(player, dbus_interface='org.freedesktop.MediaPlayer')
	# iface.connect_to_signal("TrackChange", trackChanged)
	iface.connect_to_signal("StatusChange", trackChanged)
	saveData()
except:
	print 'Player not running'
	sys.exit(1)

mainloop = gobject.MainLoop()
print 'Save trackinfo to ' + filename
print 'Ctrl+C to exit...'

try:
	mainloop.run()
except KeyboardInterrupt:
	sys.exit(1)
