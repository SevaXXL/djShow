' Get current track from iTunes

Option Explicit

Dim Args
Set Args = WScript.Arguments
If Args.count > 0 Then
	Dim iTunes
	Set iTunes = CreateObject("iTunes.Application")
	If iTunes.PlayerState = 1 Then
		If CLng(Args(0)) <> iTunes.CurrentTrack.TrackID Then
			Dim Data
			Set Data = CreateObject("ADODB.Stream")
    		Data.Type = 2
    		Data.Mode = 3
    		Data.Open
    		Data.Charset = "UTF-8"
    		Data.WriteText "<title>" & iTunes.CurrentTrack.Name & "</title><artist>" & iTunes.CurrentTrack.Artist & "</artist><genre>" & iTunes.CurrentTrack.Genre & "</genre>"
			Data.SaveToFile "NowPlaying.txt", 2
			Data.Close
			WScript.Echo iTunes.CurrentTrack.TrackID
		End If
	End If
End If
