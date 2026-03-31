@echo off
echo ========================================================
echo       SeaRates Child API - Production Start
echo ========================================================

echo Starting SeaRates Child API with PM2...
pm2 start ecosystem.config.js --env production
pm2 save

echo.
echo Process list:
pm2 list
echo.
echo SeaRates Child API has been started/restarted.
pause
