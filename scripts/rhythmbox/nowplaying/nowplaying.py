#!/usr/bin/python3
# coding=utf-8

from gi.repository import Peas, GObject, RB
import os

class NowPlaying(GObject.Object, Peas.Activatable):

    __gtype_name = 'NowPlaying'
    object = GObject.property(type=GObject.Object)

    def do_activate(self):
        """
        Called when the plugin is activated
        """
        self.shell = self.object
        self.player = self.shell.props.shell_player
        self.player.connect("playing-song-changed", self.on_playing_changed)

    def on_playing_changed(self, two, tree):
        playing_entry = self.player.get_playing_entry()
        if playing_entry is None:
            return
        title  = 'Title: ' + playing_entry.get_string(RB.RhythmDBPropType.TITLE)
        artist = 'Artist: ' + playing_entry.get_string(RB.RhythmDBPropType.ARTIST)
        datafile = open('/home/user/djShow/NowPlaying.txt', 'w')
        datafile.write(title + '\n' + artist)
        datafile.close()

    def do_deactivate(self):
        """
        Called when plugin is deactivated
        """
