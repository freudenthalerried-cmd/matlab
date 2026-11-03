# PV-Monitor fuer Windows installieren (Python, Programm, Autostart, Desktop-Verknuepfung).
# Start: Windows-Taste + X -> "Terminal" -> diese Zeile einfuegen -> Enter:
#   irm https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/main/sems/install-windows.ps1 | iex
$ErrorActionPreference = "Stop"
$Src = "https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/main/sems"
$Dir = Join-Path $env:LOCALAPPDATA "PV-Monitor"
New-Item -ItemType Directory -Force -Path $Dir | Out-Null

function Find-Python {
    foreach ($cmd in @("py -3", "python")) {
        try {
            $exe = Invoke-Expression "$cmd -c `"import sys; print(sys.executable)`"" 2>$null
            if ($LASTEXITCODE -eq 0 -and $exe -and (Test-Path $exe)) { return $exe.Trim() }
        } catch {}
    }
    $local = Get-ChildItem "$env:LOCALAPPDATA\Programs\Python\Python3*\python.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($local) { return $local.FullName }
    return $null
}

Write-Host "1/5 Python pruefen ..."
$Python = Find-Python
if (-not $Python) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "Python fehlt und winget ist nicht verfuegbar. Bitte Python von python.org installieren und erneut starten."
    }
    Write-Host "    Python wird installiert (einmalig, ca. 1-2 Minuten) ..."
    winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements | Out-Null
    $Python = Find-Python
    if (-not $Python) { throw "Python-Installation fehlgeschlagen. Bitte von python.org installieren und erneut starten." }
}
$Pythonw = Join-Path (Split-Path $Python) "pythonw.exe"

Write-Host "2/5 Laufende Version beenden ..."
Get-CimInstance Win32_Process -Filter "Name='pythonw.exe' OR Name='python.exe'" |
    Where-Object { $_.CommandLine -like "*PV-Monitor*server.py*" } |
    ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null }

Write-Host "3/5 Programm herunterladen ..."
foreach ($f in @("server.py", "sems_client.py", "dashboard.html")) {
    Invoke-WebRequest -UseBasicParsing -Uri "$Src/$f" -OutFile (Join-Path $Dir $f)
}
& $Python -m pip install --upgrade --quiet --disable-pip-version-check goodwe qrcode
if ($LASTEXITCODE -ne 0) { throw "pip install fehlgeschlagen." }

Write-Host "4/5 Autostart und Desktop-Verknuepfung anlegen ..."
$Shell = New-Object -ComObject WScript.Shell
$Startup = [Environment]::GetFolderPath("Startup")
$Lnk = $Shell.CreateShortcut((Join-Path $Startup "PV-Monitor.lnk"))
$Lnk.TargetPath = $Pythonw
$Lnk.Arguments = "`"$Dir\server.py`" --lan"
$Lnk.WorkingDirectory = $Dir
$Lnk.Save()
$Desktop = [Environment]::GetFolderPath("Desktop")
Set-Content -Path (Join-Path $Desktop "PV-Monitor.url") -Value "[InternetShortcut]`r`nURL=http://127.0.0.1:8080/"

Write-Host "5/5 Starten ..."
Start-Process -FilePath $Pythonw -ArgumentList "`"$Dir\server.py`" --lan" -WorkingDirectory $Dir
Start-Sleep -Seconds 8   # erster Start sucht den Wechselrichter im WLAN
Start-Process "http://127.0.0.1:8080/"
Write-Host ""
Write-Host "Fertig. Der PV-Monitor startet ab jetzt automatisch mit Windows."
Write-Host "Oeffnen: Desktop-Symbol 'PV-Monitor'. Handy: im Dashboard auf das Handy-Symbol tippen und QR-Code scannen. Fragt Windows nach der Firewall: 'Zulassen' (fuer das Handy im WLAN)."
Write-Host "Log: $env:APPDATA\PV-Monitor\server.log"
$Ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | Select-Object -First 1).IPv4Address.IPAddress
if ($Ip) { Write-Host ""; Write-Host "Handy-Link (nur im eigenen WLAN): http://${Ip}:8080" -ForegroundColor Green }
