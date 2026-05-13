@echo off
setlocal

echo [1/3] Sprawdzanie portu 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Wykryto proces na porcie 3000 (PID: %%a). Zamykanie...
    taskkill /F /PID %%a
)

echo [2/3] Uruchamianie serwerow...
:: Uruchamiamy w nowych oknach, aby uzytkownik widzial ze dzialaja
start "SERWER LOGO (PORT 3005)" node tools/fixer-server.mjs
start "SERWER NEXT.JS (PORT 3000)" npm run dev

echo.
echo [3/3] Otwieranie narzedzi...
timeout /t 8
start http://localhost:3000/narzedzia/logo-fixer
echo.
echo ========================================================
echo GOTOWE! Narzedzie powinno byc widoczne w przegladarce.
echo.
echo UWAGA: Nie zamykaj czarnych okien terminala, ktore sie otworzyly!
echo Sa one potrzebne do poprawnego dzialania wgrywania logo.
echo ========================================================
echo.
echo Mozesz tez uzyc wersji standalone:
echo %~dp0tools\logo-fixer-standalone.html
echo.
pause
