@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul && (set PY=py -3) || (set PY=python)
%PY% --version >nul 2>nul || (
  echo Python ist nicht installiert. Bitte von https://www.python.org/downloads/ installieren
  echo und beim Setup "Add python.exe to PATH" anhaken. Danach start.bat erneut starten.
  pause
  exit /b
)
echo Fenster offen lassen, solange du die Buchhaltung benutzt!
start "" http://localhost:8765
%PY% server.py
pause
