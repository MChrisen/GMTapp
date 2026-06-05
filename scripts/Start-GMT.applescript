-- Kompileres til "Start GMT.app" (scripts/build-launcher-app.sh).
-- AppleScript-applet har altid en eksekverbar binær — mere pålidelig end shell i .app efter git clone.
on run
	set appPosix to POSIX path of (path to me)
	set projectPosix to do shell script "dirname " & quoted form of appPosix
	set launchScript to projectPosix & "/scripts/launch-gmt.sh"
	do shell script "export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin; /bin/bash " & quoted form of launchScript
end run
