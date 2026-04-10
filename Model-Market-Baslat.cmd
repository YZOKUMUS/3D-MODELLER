@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Model Market - Expo

REM 8081 baska Expo/Metro tarafindan kullaniliyorsa soru sormadan 8082 kullan.
REM 8082 de doluysa asagidaki sayiyi degistirin (or. 8083).
set CI=1

echo.
echo Model Market baslatiliyor...
echo Proje: %CD%
echo Metro: 8082  ^|  Tarayici -w ile acilir. Kapatmak: Ctrl+C
echo.

call npx expo start --port 8082 -w

echo.
pause
