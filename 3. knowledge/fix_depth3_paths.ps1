# Fix external require() paths in files that were moved from controller/X/ (depth 2)
# into controller/hots_controller/X/ (depth 3).
# These files need their external paths bumped up by 2 extra levels (../../ → ../../../../)

$controllerRoot = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller'

# These subdirs inside hots_controller were PREVIOUSLY at controller/engine, controller/meetingbook, etc.
# (depth 2). Now they are inside hots_controller (depth 3). External paths need 2 more ../ levels.
$depth3Dirs = @(
    "$controllerRoot\hots_controller\engine",
    "$controllerRoot\hots_controller\meetingbook"
)

# External module prefixes that should NOT be resolved within hots_controller
# (they live at the AntiGravityWorktree root, not inside controller)
$externalPrefixes = @('config', 'core', 'script', 'service', 'middleware', 'helper', 'utils')

$totalFixed = 0

foreach ($dir in $depth3Dirs) {
    if (-not (Test-Path $dir)) {
        Write-Host "Skipping (not found): $dir"
        continue
    }

    $files = Get-ChildItem -Path $dir -Filter '*.js' -Recurse

    foreach ($f in $files) {
        $content = Get-Content $f.FullName -Raw -Encoding UTF8
        $original = $content

        foreach ($prefix in $externalPrefixes) {
            # Pattern: require('../../prefix/ or require("../../prefix/
            # Or require('../../prefix') for direct file references
            $old2Single = "require('../../$prefix/"
            $new4Single = "require('../../../../$prefix/"
            $old2Double = "require(`"../../$prefix/"
            $new4Double = "require(`"../../../../$prefix/"

            # Also handle when it's not a folder (e.g. ../../config/db without trailing slash already handled above)
            $content = $content.Replace($old2Single, $new4Single)
            $content = $content.Replace($old2Double, $new4Double)
        }

        if ($content -ne $original) {
            Set-Content $f.FullName $content -NoNewline -Encoding UTF8
            Write-Host "Fixed: $($f.FullName)"
            $totalFixed++
        }
    }
}

Write-Host ""
Write-Host "Total files fixed: $totalFixed"
