'******************************************************'
' wscript_shell_CreateShortcut                         '
'******************************************************'
Option Explicit
dim WshShell
set WshShell = WScript.CreateObject("WScript.Shell")
Sub CreateDesktop()
	dim DPath, TPath, PArch, LinkDesktop
	DPath = WshShell.SpecialFolders("Desktop")
	TPath = WshShell.CurrentDirectory
	PArch = WshShell.Environment("SYSTEM").Item("PROCESSOR_ARCHITECTURE")
	if not PArch = "x86" then PArch = "x64" end if
	set LinkDesktop = WshShell.CreateShortcut(DPath & "\djShow.lnk")
	With LinkDesktop
		.Arguments = TPath & "\server 8888"
		.IconLocation = WshShell.ExpandEnvironmentStrings(TPath & "\djshow.ico")
		.TargetPath = WshShell.ExpandEnvironmentStrings(TPath & "\nodejs\" & PArch & "\node.exe")
		.WindowStyle = 1
		.WorkingDirectory = WshShell.ExpandEnvironmentStrings(TPath)
		.Save()
	End With
End Sub
Call CreateDesktop
MsgBox "Shortcut created on Desktop"