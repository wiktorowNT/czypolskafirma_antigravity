' Uruchamia Panel firm bez czarnego okna terminala.
' Skrot na pulpicie ("CzyPolskaFirma - Panel") wskazuje na ten plik.
' Panel sam otwiera przegladarke na http://localhost:3010/.
' Zatrzymanie: przycisk "Zamknij panel" w lewym dolnym rogu strony.
Set powloka = CreateObject("WScript.Shell")
katalog = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
powloka.Run """" & katalog & "\panel.cmd""", 0, False
