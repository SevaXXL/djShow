(*
 *  Copyright (C) 2015-2016 Aleksandr Deinega <adeinega@mail.ru>
 *
 *  This file is part of djShow.
 *
 *  djShow is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  djShow is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with djShow. If not, see <http://www.gnu.org/licenses/>.
 *)

global previous
global filepath

on run
	set filepath to POSIX path of ((path to me as text) & "::") & "NowPlaying.txt"
	display notification "Listen VOX"
	set previous to ""
	set trackData to my getData()
	if trackData is not false then
		set previous to trackData
		my writeToFile(trackData)
	end if
end run

on idle
	set trackData to my getData()
	if trackData is not false then
		if trackData is not previous then
			set previous to trackData
			my writeToFile(trackData)
		end if
	end if
	return 5
end idle

--
-- Get title and artist of current track
-- return string || false is not playing
on getData()
	set trackData to false
	tell application "System Events"
		if (count (every process whose name is "VOX")) is not 0 then
			tell application "VOX"
				if player state is 1 then
					set trackTitle to track
					set trackArtist to artist
					set trackData to "<title>" & trackTitle & "</title><artist>" & trackArtist & "</artist>"
				end if
			end tell
		end if
	end tell
	return trackData
end getData

--
-- Write data to file
-- @param global filename is name of text file
-- @param string trackdata is writed text
-- return true || false
on writeToFile(trackData)
	try
		set filepath to filepath as string
		set openfile to open for access filepath with write permission
		set eof of the openfile to 0
		write trackData to openfile as «class utf8» starting at eof
		close access openfile
		return true
	on error
		try
			close access filepath
		end try
		return false
	end try
end writeToFile
