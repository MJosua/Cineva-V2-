$routersRoot = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\routers'

$fixed = 0
$allFiles = Get-ChildItem -Path $routersRoot -Filter '*.js' -Recurse

foreach ($f in $allFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    # Only replace if NOT already fixed (avoid double-replacement)
    # Replace bare controller/engine/ that is NOT preceded by hots_controller/
    if ($content -match 'controller/engine/' -and $content -notmatch 'controller/hots_controller/engine/') {
        $content = $content.Replace("controller/engine/", "controller/hots_controller/engine/")
    }
    # Similar guard for meetingbook
    if ($content -match 'controller/meetingbook/' -and $content -notmatch 'controller/hots_controller/meetingbook/') {
        $content = $content.Replace("controller/meetingbook/", "controller/hots_controller/meetingbook/")
    }
    # Dedup safety: remove any accidental double hots_controller
    $content = $content.Replace("controller/hots_controller/hots_controller/", "controller/hots_controller/")

    if ($content -ne $original) {
        Set-Content $f.FullName $content -NoNewline -Encoding UTF8
        Write-Host "Fixed: $($f.FullName)"
        $fixed++
    }
}

Write-Host ""
Write-Host "Total fixed: $fixed router files"
