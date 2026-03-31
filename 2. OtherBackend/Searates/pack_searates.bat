@echo off
echo ========================================================
echo       SeaRates Child API - Production Packager
echo ========================================================

:: Get date and time for filename
for /f "tokens=*" %%a in ('powershell -Command "Get-Date -format 'yyyy-MM-dd_HH-mm'"') do set TODAY=%%a
set ZIP_NAME=Searates_Child_API_%TODAY%.zip

echo [1/4] cleaning previous zip...
if exist %ZIP_NAME% del %ZIP_NAME%

echo [2/4] Vendoring shared dependencies...
:: Create local folder for shared logic
if not exist shared_services\service\searates mkdir shared_services\service\searates
:: Copy tracking engine and analytics logic from root (2 levels up)
xcopy /E /Y ..\..\service\searates\* shared_services\service\searates\

echo [3/4] Zipping files for production...
:: Temporarily remove hidden attribute from .env if it exists
if exist .env attrib -h .env

powershell -Command "$items = 'Utility', 'automation', 'config', 'controller', 'logs', 'mailer', 'routers', 'shared_services', 'index.js', 'package.json', 'package-lock.json', 'ecosystem.config.js', '.env', 'testing-utils.js' | Get-Item -Force -ErrorAction SilentlyContinue; Compress-Archive -Path $items -DestinationPath %ZIP_NAME% -Force"

:: Restore hidden attribute to .env
if exist .env attrib +h .env

echo [4/4] Cleaning up vendored files...
if exist shared_services rmdir /S /Q shared_services

echo [DONE] Package created: %ZIP_NAME%
echo.
echo Package created: %ZIP_NAME%
echo.
pause
