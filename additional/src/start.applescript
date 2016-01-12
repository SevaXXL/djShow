tell application "Terminal"
	do script "sudo node " & POSIX path of ((path to me as text) & "::") & "server.js"
	activate
end tell