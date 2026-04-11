# Masauste YZOKUMUS icin uc kisayol olusturur (proje kokundeki .cmd / .bat hedefleri).

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

$pkg = Join-Path $projectRoot 'package.json'
if (-not (Test-Path $pkg)) {
  Write-Error "package.json bulunamadi: $projectRoot"
}

$iconPng = Join-Path $projectRoot 'assets\images\icon.png'
$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell
$iconForLnk = $null
if (Test-Path $iconPng) {
  $iconForLnk = "$iconPng,0"
}

function New-YzokumusShortcut {
  param(
    [string]$LnkName,
    [string]$TargetRelative,
    [string]$Description
  )
  $targetPath = Join-Path $projectRoot $TargetRelative
  if (-not (Test-Path $targetPath)) {
    Write-Warning "Atlandi (yok): $targetPath"
    return
  }
  $lnkPath = Join-Path $desktop $LnkName
  $shortcut = $shell.CreateShortcut($lnkPath)
  $shortcut.TargetPath = $targetPath
  $shortcut.WorkingDirectory = $projectRoot
  $shortcut.WindowStyle = 1
  $shortcut.Description = $Description
  if ($script:iconForLnk) {
    $shortcut.IconLocation = $script:iconForLnk
  }
  $shortcut.Save()
  Write-Host "  OK: $lnkPath"
}

Write-Host "Masaustu kisayollari olusturuluyor..."
Write-Host "Hedef klasor: $projectRoot"
Write-Host ""

New-YzokumusShortcut -LnkName 'YZOKUMUS - Yerel vitrin.lnk' `
  -TargetRelative 'Model-Market-Baslat.cmd' `
  -Description 'YZOKUMUS - Expo yerel vitrin (localhost:8082)'

New-YzokumusShortcut -LnkName 'YZOKUMUS - Admin.lnk' `
  -TargetRelative 'Model-Admin.cmd' `
  -Description 'YZOKUMUS - Model admin paneli (localhost:3333)'

New-YzokumusShortcut -LnkName 'YZOKUMUS - Kategori ekle.lnk' `
  -TargetRelative 'Kategori-Ekle.bat' `
  -Description 'YZOKUMUS - catalog.ts icine yeni kategori'

Write-Host ""
Write-Host "Bitti. Eski 'Model Market.lnk' veya 'YZOKUMUS.lnk' tek basina kaldiysa gereksizse sil."
