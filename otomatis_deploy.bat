@echo off
title Auto Deploy Buku Kas to GitHub & aaPanel
echo ========================================================
echo       MEMULAI PROSES BUILD & AUTO DEPLOY KE AAPANEL
echo ========================================================
echo.

cd /d "%~dp0frontend"

echo [1/4] Mengompilasi Frontend (Vite Build)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build frontend gagal!
    pause
    exit /b %errorlevel%
)

cd /d "%~dp0"

echo [2/4] Menyalin file hasil build ke web root...
xcopy /E /Y /I frontend\dist\* . > nul
tar -a -cf bukukas_dist.zip -C frontend\dist .

echo [3/4] Melakukan Commit ke Git...
git add .
set /p commit_msg="Masukkan pesan update (atau tekan Enter untuk default): "
if "%commit_msg%"=="" set commit_msg=Auto update aplikasi dan aset

git commit -m "%commit_msg%"

echo [4/4] Mengunggah (Push) ke GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo [ERROR] Gagal push ke GitHub! Periksa koneksi internet Anda.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo   BERHASIL! Update telah terkirim ke GitHub.
echo ========================================================
echo.
pause
