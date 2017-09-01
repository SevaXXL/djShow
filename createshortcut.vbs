'******************************************************
' wscript_shell_CreateShortcut
'******************************************************
Option Explicit
Dim WshShell
Set WshShell = WScript.CreateObject("WScript.Shell")
Sub CreateDesktop()
	Dim DPath, TPath, PArch, LinkDesktop
	DPath = WshShell.SpecialFolders("Desktop")
	TPath = WshShell.CurrentDirectory
	PArch = WshShell.Environment("SYSTEM").Item("PROCESSOR_ARCHITECTURE")
	If PArch <> "x86" Then PArch = "x64"
	Set LinkDesktop = WshShell.CreateShortcut(DPath & "\djShow.lnk")
	With LinkDesktop
		.Arguments = Chr(34) & TPath & "\server.js" & Chr(34) & "8888"
		.IconLocation = WshShell.ExpandEnvironmentStrings(TPath & "\favicon.ico")
		.TargetPath = WshShell.ExpandEnvironmentStrings(TPath & "\nodejs\" & PArch & "\node.exe")
		.WindowStyle = 1
		.WorkingDirectory = WshShell.ExpandEnvironmentStrings(TPath)
		.Save()
	End With
End Sub
Call CreateDesktop
MsgBox "Shortcut is created on Desktop"