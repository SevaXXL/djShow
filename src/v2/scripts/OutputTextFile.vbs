' OutputTextFile.vbs
' Write the current playing track and artist to a text file

' Add text to file MediaMonkey\Scripts\Scripts.ini
'
' [OutputTextFile]
' FileName=OutputTextFile.vbs
' ProcName=OutputTextFile
' Language=VBScript
' ScriptType=2
'

option explicit

sub OutputTextFile
   dim Data, strTextFilePath
   set Data = CreateObject("ADODB.Stream")
   strTextFilePath = "c:\djShow\NowPlaying.txt"
   Data.Type = 2
   Data.Mode = 3
   Data.Open
   Data.Charset = "UTF-8"
   Data.WriteText "<title>" & SDB.Player.CurrentSong.Title & "</title><artist>" & SDB.Player.CurrentSong.Artist.Name & "</artist><genre>" & SDB.Player.CurrentSong.Genre & "</genre>"
   Data.SaveToFile strTextFilePath, 2
   Data.Close
end sub