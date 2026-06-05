-- Start GMT.app — må ligge i hele GMTapp-mappen ved siden af Start GMT.command.
-- Ved dobbeltklik åbnes Start GMT.command (undgår App Translocation-problemer).
on run
	set appPosix to POSIX path of (path to me)

	if appPosix contains "AppTranslocation" then
		display alert "GMT kan ikke starte fra denne kopi" message "macOS har flyttet Start GMT.app til en midlertidig mappe (App Translocation). Så findes scripts og dist ikke.

Gør sådan i stedet:
1. git clone https://github.com/MChrisen/GMTapp.git
2. Åbn mappen GMTapp i Finder
3. Dobbeltklik «Start GMT.command» (ikke .app alene)

Flyt aldrig kun .app-filen ud af projektmappen." buttons {"OK"} default button 1
		return
	end if

	set projectPosix to do shell script "dirname " & quoted form of appPosix
	set pkgJson to projectPosix & "/package.json"
	set cmdFile to projectPosix & "/Start GMT.command"

	try
		do shell script "test -f " & quoted form of pkgJson
	on error
		display alert "Mangler GMTapp-filer" message "package.json findes ikke ved siden af Start GMT.app.

Du skal bruge hele mappen fra GitHub — dobbeltklik «Start GMT.command» i mappen GMTapp." buttons {"OK"} default button 1
		return
	end try

	try
		do shell script "test -f " & quoted form of cmdFile
	on error
		display alert "Mangler Start GMT.command" message "Filen Start GMT.command skal ligge i samme mappe som Start GMT.app. Hent projektet igen: git clone https://github.com/MChrisen/GMTapp.git" buttons {"OK"} default button 1
		return
	end try

	do shell script "open " & quoted form of cmdFile
end run
