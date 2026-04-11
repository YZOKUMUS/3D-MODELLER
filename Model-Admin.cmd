@echo off
chcp 65001 >nul
cd /d "%~dp0"
title YZOKUMUS - Admin Panel

echo.
echo  YZOKUMUS Admin Paneli
echo  Proje: %CD%
echo.

REM Port 3333 doluysa once eski islemi kapat
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3333 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Sunucuyu arka planda baslat, sonra tarayiciyi ac
start /B node scripts\admin.cjs
echo  Sunucu baslatiliyor, lutfen bekleyin...
timeout /t 2 /nobreak >nul
start "" http://localhost:3333
echo  Tarayici acildi: http://localhost:3333
echo.
echo  Model Ekle:  http://localhost:3333
echo  Model Sil:   http://localhost:3333/manage
echo.
echo  Kapatmak icin bu pencereyi kapatin veya Ctrl+C basin.
echo.

pause >nul
