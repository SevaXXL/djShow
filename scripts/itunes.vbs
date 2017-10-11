'
' Get current track from iTunes
'

Option Explicit

Dim iTunes
Dim Fso
Dim Tf
Dim Args

Const NOWPLAYING_FILE = "NowPlaying.txt"
Const FROM_CHARSET = "Windows-1251"
Const TO_CHARSET = "UTF-8"

Function StrConvert(Str)
    Dim Stream
    Set Stream = CreateObject("ADODB.Stream")
    Stream.Type = 2
    Stream.Mode = 3
    Stream.Open
    Stream.Charset = TO_CHARSET
    Stream.WriteText Str
    Stream.Position = 0
    Stream.Charset = FROM_CHARSET
    StrConvert = Stream.ReadText
End Function

Set Args = WScript.Arguments
If Args.count > 0 Then
	Set iTunes = CreateObject("iTunes.Application")
	If iTunes.PlayerState = 1 Then
		If CLng(Args(0)) <> iTunes.CurrentTrack.TrackID Then
			Set Fso = CreateObject("Scripting.FileSystemObject")
			Set Tf = Fso.CreateTextFile(NOWPLAYING_FILE, True)
			Tf.WriteLine("Title: " & StrConvert(iTunes.CurrentTrack.Name))
			Tf.WriteLine("Artist: " & StrConvert(iTunes.CurrentTrack.Artist))
			Tf.WriteLine("Genre: " & StrConvert(iTunes.CurrentTrack.Genre))
			Tf.Close
			WScript.Echo iTunes.CurrentTrack.TrackID
		End If
	End If
End If
