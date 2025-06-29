-- Script Editor: File > Export > Application + Stay open after run hundler

global dataFile
global previousTrackID

on run
	display notification "Listen Embrace"
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
		if (count (every process whose name is "Embrace Trial")) is not 0 then
			tell application "Embrace Trial"
				try
					if track status of current track is playing and file of current track is not previousTrackID then
						set previousTrackID to file of current track
						set trackData to {}
						set the end of trackData to "<title>" & title of current track & "</title>"
						set the end of trackData to "<artist>" & artist of current track & "</artist>"
						set the end of trackData to "<genre>" & genre of current track & "</genre>"
						set trackData to trackData as string
						do shell script "echo " & quoted form of trackData & " > " & quoted form of dataFile
					end if
				end try
			end tell
		end if
	end tell
end checkTrack