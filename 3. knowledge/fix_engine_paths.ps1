$dir = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller\hots_controller\engine'
$externalPrefixes = @('config', 'core', 'script', 'service', 'middleware', 'helper', 'utils')
$fixed = 0

foreach ($f in (Get-ChildItem -Path $dir -Filter '*.js' -Recurse)) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    foreach ($prefix in $externalPrefixes) {
        # Revert over-fix: ../../../../prefix/ should be ../../../prefix/
        $old4single = "require('../../../../" + $prefix + "/"
        $new3single = "require('../../../" + $prefix + "/"
        $old4double = 'require("../../../../' + $prefix + "/"
        $new3double = 'require("../../../' + $prefix + "/"
        $content = $content.Replace($old4single, $new3single)
        $content = $content.Replace($old4double, $new3double)
    }

    if ($content -ne $original) {
        Set-Content $f.FullName $content -NoNewline -Encoding UTF8
        Write-Host "Fixed: $($f.FullName)"
        $fixed++
    }
}
Write-Host "Total fixed: $fixed"
