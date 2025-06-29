-- Script Editor: File > Export > Application - Stay open after run hundler

global dataFile
global previousTrackID

on run
	display notification "Listen VOX"
	set previousTrackID to ""
	set dataFile to POSIX path of ((path to me as string) & "::") & "NowPlaying.txt"
	my checkTrack()
end run

on idle
	my checkTrack()
	return 4
end idle

on checkTrack()
	tell application "System Events"
		if (count (every process whose name is "VOX")) is not 0 then
			tell application "VOX"
				if player state is 1 and unique ID is not previousTrackID then
					set previousTrackID to unique ID
					set trackData to {}
					set the end of trackData to "<title>" & track & "</title>"
					set the end of trackData to "<artist>" & artist & "</artist>"
					set trackData to trackData as string
					do shell script "echo " & quoted form of trackData & " > " & quoted form of dataFile
				end if
			end tell
		end if
	end tell
end checkTrack
