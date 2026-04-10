@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Model Market - Expo

echo.
echo  Model Market baslatiliyor...
echo  Proje: %CD%
echo.

REM Eski Expo/Metro islemlerini kapat
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8082 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Expo'nun otomatik tarayici acmasini engelle
set CI=1
set BROWSER=none

REM Sunucuyu arka planda baslat
start /B npx expo start --port 8082

echo  Sunucu baslatiliyor, lutfen bekleyin...
timeout /t 6 /nobreak >nul

REM Yerel Metro web kokte acilir (/). /3D-MODELLER/ sadece GitHub static export icin.
start "" http://localhost:8082/

echo.
echo  Tarayici acildi: http://localhost:8082/
echo  Kapatmak icin bu pencereyi kapatin veya Ctrl+C basin.
echo.

pause >nul
