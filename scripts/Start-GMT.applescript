-- Kompileres til Start GMT.app. Åbner Terminal så fejl er synlige.
on run
	set appPosix to POSIX path of (path to me)
	set projectPosix to do shell script "dirname " & quoted form of appPosix
	set launchCmd to "xattr -dr com.apple.quarantine " & quoted form of projectPosix & " 2>/dev/null; chmod +x " & quoted form of (projectPosix & "/scripts/launch-gmt.sh") & " 2>/dev/null; /bin/bash " & quoted form of (projectPosix & "/scripts/launch-gmt.sh")
	tell application "Terminal"
		activate
		do script launchCmd
	end tell
end run
