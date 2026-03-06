$routersRoot = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\routers'
$fixed = 0

foreach ($f in (Get-ChildItem -Path $routersRoot -Filter '*.js' -Recurse)) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    # Fix doubled hots_controller from script running twice
    $content = $content.Replace("controller/hots_controller/hots_controller/", "controller/hots_controller/")

    if ($content -ne $original) {
        Set-Content $f.FullName $content -NoNewline -Encoding UTF8
        Write-Host "Fixed: $($f.FullName)"
        $fixed++
    }
}
Write-Host "Total deduped: $fixed files"
