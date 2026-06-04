on run
	set projectPosix to POSIX path of (container of (path to me))
	do shell script "cd " & quoted form of projectPosix & " && ./GMT\\ App.command"
end run
