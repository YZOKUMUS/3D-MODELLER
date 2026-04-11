@echo off
chcp 65001 >nul
title Model Market - Yeni kategori
cd /d "%~dp0"

echo.
echo  Model Market - Yeni kategori ekleme
echo  (catalog.ts dosyasi guncellenir)
echo.

set /p AD="Kategori adini yazip Enter basin: "
if "%AD%"=="" (
  echo Bos ad gecersiz.
  pause
  exit /b 1
)

node scripts\add-category.cjs "%AD%"
if errorlevel 1 (
  echo.
  echo Islem basarisiz.
  pause
  exit /b 1
)

echo.
pause
