@echo off
rem PV-Monitor starten: Doppelklick. Voraussetzung: Python von python.org (Haken "Add to PATH").
cd /d "%~dp0"
python -m pip install --quiet --upgrade goodwe
start "" cmd /c "timeout /t 5 >nul & start http://127.0.0.1:8080"
python server.py --local %1 --lan
pause
