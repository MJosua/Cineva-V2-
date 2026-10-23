$ErrorActionPreference='Stop'
$nodes=@(Get-CimInstance Win32_Process -Filter "name='node.exe'" | ForEach-Object {
  $paths=@([regex]::Matches($_.CommandLine,'"([^"]*)"|(\S+)') | ForEach-Object { $token=if($_.Groups[1].Success){$_.Groups[1].Value}else{$_.Groups[2].Value}; if($token -match '^[A-Za-z]:[\\/].*\.(js|cjs|mjs)$' -and $token -notmatch '[=<>]'){$token} })
  [pscustomobject]@{pid=$_.ProcessId; script_paths=$paths}
})
$configs=@()
foreach($candidate in @('D:\jinx\conf\nginx.conf','D:\nginx\conf\nginx.conf')) {
 if(Test-Path -LiteralPath $candidate){
  $lines=@(Get-Content -LiteralPath $candidate | Where-Object {$_ -match '^\s*(server_name|listen|location|proxy_pass|root|alias|include)\b'} | ForEach-Object {$_ -replace '(https?://)[^/@\s]+:[^/@\s]+@','$1[redacted]@'})
  $configs += [pscustomobject]@{path=$candidate; routing_lines=$lines}
 }
}
[pscustomobject]@{nodes=$nodes;configs=$configs}|ConvertTo-Json -Depth 7 -Compress
