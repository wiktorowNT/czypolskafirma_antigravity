@echo off
rem Uruchamia Panel firm i otwiera go w przegladarce.
rem Zwykle wolane przez "panel.vbs" (bez czarnego okna) albo skrot z pulpitu.
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
set "NODE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"
"%NODE%" tools\firmy\panel.mjs %*
endlocal
