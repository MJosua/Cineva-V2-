$ErrorActionPreference='Stop'
$apiRoot='D:\hehe\hehehe\hehehehe\hehe\[PRODUCTION] IOD-INTEGRATED_API v2.8.x'
$result=@()
foreach($name in @('.env','.env.local')) {
 $file=Join-Path $apiRoot $name
 if(Test-Path -LiteralPath $file){
  $settings=@()
  foreach($line in (Get-Content -LiteralPath $file)) {
   if($line -match '^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$'){
    $key=$Matches[1];$value=$Matches[2].Trim().Trim('"').Trim("'")
    if($key -match '^(OIDC_ISSUER|SSO_ISSUER|SSO_REDIRECT_URI|SSO_REDIRECT_URL|SSO_CALLBACK_URL)$'){
     $uri=$null
     if([Uri]::TryCreate($value,[UriKind]::Absolute,[ref]$uri) -and !$uri.UserInfo -and !$uri.Query -and !$uri.Fragment){$settings+=[pscustomobject]@{key=$key;value=$uri.AbsoluteUri}}
    }elseif($key -eq 'SSO_CLIENT_ID'){$settings+=[pscustomobject]@{key=$key;value=$value}}
    elseif($key -match '^(SSO_CLIENT_SECRET|OIDC_SESSION_COOKIE_KEYS|OIDC_JWKS_FILE)$'){$settings+=[pscustomobject]@{key=$key;configured=![string]::IsNullOrWhiteSpace($value)}}
   }
  }
  $result+=[pscustomobject]@{file=$file;settings=$settings}
 }
}
$dump='C:\Users\Administrator\.pm2\dump.pm2'
$apps=@()
if(Test-Path -LiteralPath $dump){try{$apps=@(Get-Content -LiteralPath $dump -Raw|ConvertFrom-Json|ForEach-Object{[pscustomobject]@{name=$_.name;cwd=$_.pm_cwd;script=$_.pm_exec_path}})}catch{$apps=@([pscustomobject]@{inspection='PM2 dump has case-colliding keys; not printed'})}}
[pscustomobject]@{env_files=$result;pm2_apps=$apps}|ConvertTo-Json -Depth 7 -Compress
