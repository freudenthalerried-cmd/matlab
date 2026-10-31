# Einmalig ausführen (über einrichten.bat): legt Desktop-Symbol und Autostart an.
$ordner = $PSScriptRoot
$pyw = (Get-Command pyw, pythonw -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $pyw) {
    Write-Host "Python fehlt. Bitte von https://www.python.org/downloads/ installieren ('Add python.exe to PATH' anhaken)."
    exit 1
}
$shell = New-Object -ComObject WScript.Shell
$ziele = @(
    @{ Pfad = [Environment]::GetFolderPath("Desktop"); Argumente = "" },            # Doppelklick -> App-Fenster
    @{ Pfad = [Environment]::GetFolderPath("Startup"); Argumente = " --hintergrund" } # beim Hochfahren still starten
)
foreach ($z in $ziele) {
    $link = $shell.CreateShortcut((Join-Path $z.Pfad "Buchhaltung.lnk"))
    $link.TargetPath = $pyw
    $link.Arguments = "`"$ordner\server.py`"" + $z.Argumente
    $link.WorkingDirectory = $ordner
    $link.IconLocation = "$ordner\icon.ico"
    $link.Save()
}
Write-Host "Fertig: Symbol 'Buchhaltung' auf dem Desktop, Start automatisch beim Hochfahren."
Start-Process $pyw -ArgumentList "`"$ordner\server.py`"" -WorkingDirectory $ordner
