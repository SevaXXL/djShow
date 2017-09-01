'******************************************************'
' wscript_shell_CreateShortcut                         '
'******************************************************'
Option Explicit
Dim WshShell
Set WshShell = WScript.CreateObject("WScript.Shell")
Sub CreateDesktop()
	Dim DPath, TPath, PArch, LinkDesktop
	DPath = WshShell.SpecialFolders("Desktop")
	TPath = WshShell.CurrentDirectory
	PArch = WshShell.Environment("SYSTEM").Item("PROCESSOR_ARCHITECTURE")
	If PArch <> "x86" Then PArch = "x64"
	set LinkDesktop = WshShell.CreateShortcut(DPath & "\djShow.lnk")
	With LinkDesktop
		.Arguments = TPath & "\server 8888"
		.IconLocation = WshShell.ExpandEnvironmentStrings(TPath & "\favicon.ico")
		.TargetPath = WshShell.ExpandEnvironmentStrings(TPath & "\nodejs\" & PArch & "\node.exe")
		.WindowStyle = 1
		.WorkingDirectory = WshShell.ExpandEnvironmentStrings(TPath)
		.Save()
	End With
End Sub
Call CreateDesktop
MsgBox "Shortcut created on Desktop"