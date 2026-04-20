@echo off
chcp 65001 >nul
title YZOKUMUS — Android release yukleme
cd /d "%~dp0"

echo.
echo Klasor: %CD%
echo Telefon USB ile bagli olsun; USB hata ayiklama acik olsun.
echo Ilk derleme uzun surebilir.
echo.

call npx expo run:android --variant release --no-bundler

echo.
echo Bitti. Release surumu Metro olmadan telefonda acilabilir.
pause
