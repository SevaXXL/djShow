#!usr/bin/env python

import dbus
import dbus.mainloop.glib
import gobject
import sys
import os

filename = os.path.realpath(os.path.dirname(sys.argv[0])) + '/' + 'NowPlaying.txt'

def metatostr(meta):
	'''Parse data'''
	data = ''
	try:
		data += 'Title: ' + meta['title'] + '\n'
	except:
		pass
	try:
		data += 'Artist: ' + meta['artist'] + '\n'
	except:
		pass
	return data

def trackchanged(data):
	'''Callback handler track changed event'''
	savedata()

def savedata():
	'''Save data to file'''
	global iface
	global filename
	status = iface.GetStatus()[0]
	if status == 0:
		meta = iface.GetMetadata()
		data = metatostr(meta)
		
		datafile = open(filename, 'w')
		datafile.write(data.encode('utf-8'))
		datafile.close()

# Main
dbus.mainloop.glib.DBusGMainLoop(set_as_default = True)
try:
	session_bus = dbus.SessionBus()
	player = session_bus.get_object('org.mpris.clementine', '/Player')
	iface = dbus.Interface(player, dbus_interface='org.freedesktop.MediaPlayer')
	iface.connect_to_signal("TrackChange", trackchanged)
	savedata()
except:
	print 'Player not running'
	sys.exit(1)

mainloop = gobject.MainLoop()
print 'Save trackinfo to ' + filename
print 'Ctrl+C to exit...'

try:
	mainloop.run()
except KeyboardInterrupt:
	sys.exit(1);
