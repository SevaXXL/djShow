global dataFile
global previousTrackID

on run
	display notification "Listen Swinsian"
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
		if (count (every process whose name is "Swinsian")) is not 0 then
			tell application "Swinsian"
				if player state is playing and id of current track is not previousTrackID then
					set previousTrackID to id of current track
					set trackData to {}
					set the end of trackData to "<title>" & name of current track & "</title>"
					set the end of trackData to "<artist>" & artist of current track & "</artist>"
					set trackData to trackData as string
					do shell script "echo " & quoted form of trackData & " > " & quoted form of dataFile
				end if
			end tell
		end if
	end tell
end checkTrack