@echo off
setlocal
cd /d "%~dp0"
title Archicad-Assistent installieren
echo ================================================
echo   Archicad-Assistent - Installation
echo ================================================
echo.

rem --- Python suchen (3.10 oder neuer) ---
set "PY="
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1 && set "PY=py -3"
if not defined PY python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1 && set "PY=python"

if not defined PY (
    echo Python 3.10 oder neuer wurde nicht gefunden.
    choice /c JN /m "Python jetzt automatisch installieren (winget)"
    if errorlevel 2 goto :kein_python
    winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    echo.
    echo Python wurde installiert. Bitte dieses Fenster schliessen und installieren.bat erneut starten.
    pause
    exit /b 0
)
echo [OK] Python gefunden: %PY%
echo.

rem --- Programm und Abhaengigkeiten installieren ---
echo Installiere den Archicad-Assistenten ...
%PY% -m pip install --upgrade pip >nul
%PY% -m pip install -e .
if errorlevel 1 (
    echo.
    echo [FEHLER] Installation fehlgeschlagen. Bitte die Meldungen oben an Claude schicken.
    pause
    exit /b 1
)
echo [OK] Programm installiert.
echo.

rem --- API-Key einrichten ---
if defined ANTHROPIC_API_KEY (
    echo [OK] API-Key ist bereits eingerichtet.
) else (
    echo Jetzt den API-Key von https://console.anthropic.com einfuegen
    echo ^(Rechtsklick fuegt ein, danach Enter^). Er wird nur auf diesem PC gespeichert.
    set /p "KEY=API-Key: "
    call :key_speichern
)
echo.

rem --- Startdatei anlegen ---
> starten.bat echo @echo off
>> starten.bat echo cd /d "%%~dp0"
>> starten.bat echo title Archicad-Assistent
>> starten.bat echo %PY% -m archicad_assistent %%*
>> starten.bat echo pause
echo [OK] starten.bat angelegt.
echo.

echo ================================================
echo   Fertig!
echo ================================================
echo Noch zu tun, falls nicht erledigt:
echo  1. Tapir-Add-On fuer deine Archicad-Version installieren:
echo     https://github.com/ENZYME-APD/tapir-archicad-automation/releases
echo  2. Archicad mit einem Projekt oeffnen.
echo  3. starten.bat doppelklicken.
echo.
pause
exit /b 0

:key_speichern
if "%KEY%"=="" (
    echo [HINWEIS] Kein Key eingegeben. installieren.bat spaeter erneut starten.
    exit /b 0
)
setx ANTHROPIC_API_KEY "%KEY%" >nul
echo [OK] API-Key gespeichert.
exit /b 0

:kein_python
echo Bitte Python von https://www.python.org installieren
echo ^(Haken bei "Add python.exe to PATH" setzen^) und danach installieren.bat erneut starten.
pause
exit /b 1
