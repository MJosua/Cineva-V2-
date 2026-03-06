# Comprehensive path fixer for moved modules
# This script scans all JS files within controller/ and resolves broken cross-module require() paths

$controllerRoot = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller'

# These modules were MOVED inside hots_controller: any reference to them from inside hots_controller
# should now resolve within hots_controller (not go back to controller root then out to old location)
$movedIntoHotsController = @(
    'engine',         # e.g. ../engine -> was at controller/engine, now at controller/hots_controller/engine
    'meetingbook'     # e.g. ../meetingbook -> was at controller/meetingbook, now at controller/hots_controller/meetingbook
)

$allFiles = Get-ChildItem -Path $controllerRoot -Filter '*.js' -Recurse
$totalFixed = 0

foreach ($f in $allFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $original = $content
    $fileDir = $f.DirectoryName

    # Determine path from controllerRoot to this file's directory
    $relativeToController = $fileDir.Substring($controllerRoot.Length).TrimStart('\')
    $depth = if ($relativeToController -eq '') { 0 } else { ($relativeToController -split '\\').Count }

    # files inside hots_controller (depth >= 1 from controller root)
    $isInsideHotsController = $relativeToController -like 'hots_controller*'

    if ($isInsideHotsController) {
        # depth inside hots_controller
        $hotsRelative = $relativeToController.Substring('hots_controller'.Length).TrimStart('\')
        $depthInHots = if ($hotsRelative -eq '') { 0 } else { ($hotsRelative -split '\\').Count }
        # Total depth = 1 (for hots_controller itself) + depthInHots
        $totalDepth = 1 + $depthInHots

        foreach ($module in $movedIntoHotsController) {
            # The old path from inside hots_controller/* would have been something like:
            # ../../engine (from depth 2) or ../../../engine (from depth 3), etc.
            # resolving to controller/engine which no longer exists.
            # The new path should resolve to controller/hots_controller/engine.

            # For a file at depth $totalDepth inside controller/:
            # To reach controller/ from this file: need $totalDepth '../'
            # To reach controller/hots_controller/engine: need $totalDepth '../' + 'hots_controller/' + module
            # But since we're already INSIDE hots_controller, we can just go up ($totalDepth - 1) levels to reach hots_controller root:
            # e.g. file at hots_controller/auth/controllers/ (totalDepth=3): go up 2 levels -> hots_controller/
            # Then reference engine directly: ../../engine

            $upToHotsRoot = '../' * ($totalDepth - 1)  # go up to hots_controller root from inside it
            $oldPathFromControllerRoot = '../' * $totalDepth  # go all the way to controller root (wrong)

            $oldRef_singleQuote = "require('" + $oldPathFromControllerRoot + $module + "/"
            $newRef_singleQuote = "require('" + $upToHotsRoot + $module + "/"
            $oldRef_doubleQuote = 'require("' + $oldPathFromControllerRoot + $module + "/"
            $newRef_doubleQuote = 'require("' + $upToHotsRoot + $module + "/"

            # Also handle when the reference doesn't have a trailing slash (direct file require)
            $oldRefFile_single = "require('" + $oldPathFromControllerRoot + $module + "'"
            $newRefFile_single = "require('" + $upToHotsRoot + $module + "'"
            $oldRefFile_double = 'require("' + $oldPathFromControllerRoot + $module + '"'
            $newRefFile_double = 'require("' + $upToHotsRoot + $module + '"'

            $content = $content.Replace($oldRef_singleQuote, $newRef_singleQuote)
            $content = $content.Replace($oldRef_doubleQuote, $newRef_doubleQuote)
            $content = $content.Replace($oldRefFile_single, $newRefFile_single)
            $content = $content.Replace($oldRefFile_double, $newRefFile_double)
        }
    }

    # Also fix ../config, ../core, ../middleware for ALL moved dirs (regardless of depth within moved dir)
    # This is the original fix_imports logic but generalized
    $nonHotsDirs = @('OnlineOrder', 'event', 'shortener', 'searates', '_old')
    $isInMovedDir = $false
    foreach ($d in $nonHotsDirs) {
        if ($relativeToController -like "$d*") { $isInMovedDir = $true; break }
    }
    
    if ($isInsideHotsController -or $isInMovedDir) {
        # These should go up to the actual project root then reference /config etc.
        # For files 1 level deep (e.g. OnlineOrder/): ../config -> ../../config
        # The fix_imports.ps1 already handles OnlineOrder, so skip here to avoid double-fix
    }

    if ($content -ne $original) {
        Set-Content $f.FullName $content -NoNewline -Encoding UTF8
        Write-Host "Fixed: $($f.FullName)"
        $totalFixed++
    }
}

Write-Host ""
Write-Host "Total fixed: $totalFixed files"
