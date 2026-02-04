@echo off
echo ========================================================
echo       HOTS API - Production Deployment Packager
echo ========================================================

for /f "tokens=*" %%a in ('powershell -Command "Get-Date -format 'yyyy-MM-dd'"') do set TODAY=%%a
set ZIP_NAME=API_%TODAY%.zip

echo [1/3] cleanup previous zip...
if exist %ZIP_NAME% del %ZIP_NAME%

echo [2/3] Zipping important files...
echo Including: config, controller, core, routers, service, middleware, public, script
echo Including: index.js, package.json, ecosystem.config.js

powershell -Command "Compress-Archive -Path config, controller, core, routers, service, middleware, public, script, index.js, package.json, ecosystem.config.js -DestinationPath %ZIP_NAME%"

echo [3/3] Done!
echo.
echo Package created: %ZIP_NAME%
echo Ready to be sent to production server.
echo.
pause
