# Masaustune "Model Market" kisayolu ekler (Model-Market-Baslat.cmd hedefi, proje simgesi).

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

$pkg = Join-Path $projectRoot 'package.json'
if (-not (Test-Path $pkg)) {
  Write-Error "package.json bulunamadi: $projectRoot"
}

$cmdPath = Join-Path $projectRoot 'Model-Market-Baslat.cmd'
if (-not (Test-Path $cmdPath)) {
  Write-Error "Bulunamadi: $cmdPath"
}

$iconPng = Join-Path $projectRoot 'assets\images\icon.png'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'Model Market.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($lnkPath)
$shortcut.TargetPath = $cmdPath
$shortcut.WorkingDirectory = $projectRoot
$shortcut.WindowStyle = 1
$shortcut.Description = 'Model Market - Expo gelistirme sunucusu (npx expo start)'

if (Test-Path $iconPng) {
  $shortcut.IconLocation = "$iconPng,0"
}

$shortcut.Save()
Write-Host "Kisayol olusturuldu: $lnkPath"
