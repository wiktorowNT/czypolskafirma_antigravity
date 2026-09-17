@echo off
rem Strona kodowa UTF-8, bo sciezka na Dysku Google ma polski znak ("Moj dysk").
chcp 65001 >nul
rem Tygodniowy backup tabeli companies na Dysk Google (Harmonogram zadan Windows).
rem Zadanie "CzyPolskaFirma backup bazy" uruchamia ten plik w niedziele o 10:00
rem (albo przy najblizszym wlaczeniu komputera, jesli byl wylaczony).
rem Log: data\robocze\backup\backup.log
setlocal
cd /d "%~dp0..\.."
set "CEL=G:\Mój dysk\zapisy supabase czypolskafirma"
if not exist "%CEL%" set "CEL=data\robocze\backup"
if not exist "data\robocze\backup" mkdir "data\robocze\backup"
echo [%date% %time%] start, cel: %CEL%>> "data\robocze\backup\backup.log"
"C:\Program Files\nodejs\node.exe" tools\firmy\backup.mjs --do "%CEL%" >> "data\robocze\backup\backup.log" 2>&1
echo [%date% %time%] koniec (kod %errorlevel%)>> "data\robocze\backup\backup.log"
endlocal
