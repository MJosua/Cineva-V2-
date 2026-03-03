@echo off
echo ========================================================
echo       HOTS Frontend - Build and Pack
echo ========================================================

for /f "tokens=*" %%a in ('powershell -Command "Get-Date -format 'yyyy-MM-dd'"') do set TODAY=%%a
set ZIP_NAME=HOTS_FE_%TODAY%.zip

echo [1/3] Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Cleaning previous zip...
if exist %ZIP_NAME% del %ZIP_NAME%

echo [3/3] Zipping dist folder contents...
cd dist
powershell -Command "Compress-Archive -Path * -DestinationPath ..\%ZIP_NAME%"
cd ..

echo.
echo Package created: %ZIP_NAME% in fontend\HOTS
echo Ready for deployment.
pause
