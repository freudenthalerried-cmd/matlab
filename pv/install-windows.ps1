# Sonnenstand lokal – Installation unter Windows (einmal ausführen)
# Windows-Taste + X → "Terminal", dann einfügen:
#   irm https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/pv-sonnenstand/pv/install-windows.ps1 | iex
# Legt %LOCALAPPDATA%\PV-Monitor an, installiert die Bibliothek goodwe, richtet den Autostart ein
# und startet das Programm. Danach: http://127.0.0.1:8080 (am Handy im Heimnetz: http://<PC-IP>:8080).

$ErrorActionPreference = "Stop"
$Branch = "pv-sonnenstand"
$Raw = "https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/$Branch/pv"
$Dir = Join-Path $env:LOCALAPPDATA "PV-Monitor"
New-Item -ItemType Directory -Force $Dir | Out-Null

# Python finden (3.10+), sonst per winget installieren
function Find-Python {
    $cands = @()
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -notlike "*WindowsApps*") { $cands += $cmd.Source }
    $cands += Get-ChildItem "$env:LOCALAPPDATA\Programs\Python\Python3*\python.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | ForEach-Object FullName
    foreach ($c in $cands) { try { $v = & $c -c "import sys;print(sys.version_info>=(3,10))" 2>$null; if ($v -eq "True") { return $c } } catch {} }
    return $null
}
$Python = Find-Python
if (-not $Python) {
    Write-Host "Python wird installiert ..." -ForegroundColor Yellow
    winget install --id Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements | Out-Null
    $Python = Find-Python
    if (-not $Python) { throw "Python nicht gefunden. Bitte Python 3 von python.org installieren und das Skript nochmal ausführen." }
}
Write-Host "Python: $Python"

# Programmdateien holen
foreach ($f in "server.py", "index.html") {
    Invoke-WebRequest -Uri "$Raw/$f" -OutFile (Join-Path $Dir $f) -UseBasicParsing
}
& $Python -m pip install --upgrade --quiet --disable-pip-version-check goodwe
if ($LASTEXITCODE -ne 0) { throw "pip install goodwe fehlgeschlagen." }

# Autostart (ohne Konsolenfenster) und Desktop-Verknüpfung
$Pythonw = Join-Path (Split-Path $Python) "pythonw.exe"
if (-not (Test-Path $Pythonw)) { $Pythonw = $Python }
$Shell = New-Object -ComObject WScript.Shell
$Lnk = $Shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath("Startup")) "Sonnenstand lokal.lnk"))
$Lnk.TargetPath = $Pythonw
$Lnk.Arguments = "`"$(Join-Path $Dir 'server.py')`""
$Lnk.WorkingDirectory = $Dir
$Lnk.Description = "Sonnenstand: liest den GoodWe-Wechselrichter im Heimnetz"
$Lnk.Save()
Set-Content -Path (Join-Path ([Environment]::GetFolderPath("Desktop")) "Sonnenstand.url") -Value "[InternetShortcut]`r`nURL=http://127.0.0.1:8080/"

# Alten PV-Monitor-Autostart entfernen, falls vorhanden
Remove-Item (Join-Path ([Environment]::GetFolderPath("Startup")) "PV-Monitor.lnk") -ErrorAction SilentlyContinue

# Laufende Instanz beenden und neu starten
Get-CimInstance Win32_Process -Filter "Name like 'python%'" | Where-Object { $_.CommandLine -like "*PV-Monitor*server.py*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Process -FilePath $Pythonw -ArgumentList "`"$(Join-Path $Dir 'server.py')`"" -WorkingDirectory $Dir -WindowStyle Hidden
Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:8080/"

$Ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "Fertig. Sonnenstand lokal läuft und startet künftig mit Windows." -ForegroundColor Green
Write-Host "PC:    http://127.0.0.1:8080"
if ($Ip) { Write-Host "Handy (nur im Heimnetz): http://${Ip}:8080" -ForegroundColor Green }
Write-Host "Falls Windows nach der Firewall fragt: 'Zulassen' (für den Zugriff vom Handy)."
