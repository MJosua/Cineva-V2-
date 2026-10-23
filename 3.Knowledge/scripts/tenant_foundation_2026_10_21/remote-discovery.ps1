$ErrorActionPreference = 'Stop'
$profileRoot = [Environment]::GetFolderPath('UserProfile')
$dumpRoot = if ($env:PM2_HOME) { $env:PM2_HOME } else { Join-Path $profileRoot '.pm2' }
$dumpFile = Join-Path $dumpRoot 'dump.pm2'
$apps = @()
if (Test-Path -LiteralPath $dumpFile) {
  $apps = @(Get-Content -LiteralPath $dumpFile -Raw | ConvertFrom-Json | ForEach-Object { [pscustomobject]@{ name=$_.name; cwd=$_.pm_cwd; script=$_.pm_exec_path } })
}
$processes = @(Get-Process -Name node,nginx,httpd,java,tomcat11,tomcat10 -ErrorAction SilentlyContinue | Select-Object ProcessName,Path)
$services = @(Get-Service | Where-Object { $_.Name -match 'tomcat|nginx|pm2|w3svc' } | Select-Object Name,Status)
[pscustomobject]@{profile=$profileRoot; pm2_dump_found=(Test-Path -LiteralPath $dumpFile); apps=$apps; processes=$processes; services=$services} | ConvertTo-Json -Depth 6 -Compress
