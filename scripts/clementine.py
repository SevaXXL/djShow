import dbus
import dbus.mainloop.glib
import gobject
import sys
from os import path

filename = path.realpath(path.dirname(sys.argv[0])) + '/' + 'NowPlaying.txt'

def parseMeta(meta):
	data = []
	try:
		data.append('Title: ' + meta[u'title'])
	except:
		pass
	try:
		data.append('Artist: ' + meta[u'artist'])
	except:
		pass
	return "\n".join(data).encode('utf-8')

def trackChanged(data):
	saveData()

def saveData():
	global iface
	global filename
	status = iface.GetStatus()[0]
	if status == 0:
		meta = iface.GetMetadata()
		data = parseMeta(meta)
		datafile = open(filename, 'w')
		datafile.write(data)
		datafile.close()

dbus.mainloop.glib.DBusGMainLoop(set_as_default = True)
try:
	session_bus = dbus.SessionBus()
	player = session_bus.get_object('org.mpris.clementine', '/Player')
	iface = dbus.Interface(player, dbus_interface='org.freedesktop.MediaPlayer')
	iface.connect_to_signal("TrackChange", trackChanged)
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
