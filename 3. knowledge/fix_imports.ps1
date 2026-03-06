# ============================================================
# fix_imports.ps1
# ONE-STOP script to fix all broken require() paths after
# file moves in the controller/ directory reorganization.
#
# Run this after ANY file move within controller/:
#   powershell -ExecutionPolicy Bypass -File "3. knowledge/fix_imports.ps1"
# ============================================================

$controllerRoot = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller'

# External modules that live OUTSIDE controller/ (at project root level)
$externalPrefixes = @('config', 'core', 'script', 'service', 'middleware', 'helper', 'utils')

# Modules that were moved INTO hots_controller (previously at controller/X, now at controller/hots_controller/X)
$movedToHots = @('engine', 'meetingbook')

$totalFixed = 0
$allFiles = Get-ChildItem -Path $controllerRoot -Filter '*.js' -Recurse

foreach ($f in $allFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    $fileDir = $f.DirectoryName
    $relativeToController = $fileDir.Substring($controllerRoot.Length).TrimStart('\')
    $parts = if ($relativeToController -eq '') { @() } else { $relativeToController -split '\\' }
    $depth = $parts.Count  # depth 0 = directly in controller/, 1 = one subfolder deep, etc.

    $isInsideHotsController = $relativeToController -like 'hots_controller*'

    # --------------------------------------------------------
    # CASE 1: Files at depth 1 inside hots_controller/ root
    # (cardGenerator.js, user.js, etc.)
    # Fix: ../config/ → ../../config/
    # --------------------------------------------------------
    if ($isInsideHotsController -and $depth -eq 1) {
        foreach ($prefix in $externalPrefixes) {
            $content = $content.Replace("require('../$prefix/", "require('../../$prefix/")
            $content = $content.Replace("require(`"../$prefix/", "require(`"../../$prefix/")
        }
    }

    # --------------------------------------------------------
    # CASE 2: Files at depth 2 inside hots_controller/
    # (e.g. hots_controller/engine/, hots_controller/meetingbook/)
    # These were previously at controller/engine/ (depth 1 from controllerRoot),
    # so they had ../../config (2 levels from AntiGravityWorktree root = correct).
    # Now at hots_controller/engine/ they are depth 3 from AntiGravityWorktree root,
    # so they need ../../../config (3 levels up).
    # Fix: ../../config/ → ../../../config/
    # --------------------------------------------------------
    if ($isInsideHotsController -and $depth -eq 2) {
        foreach ($prefix in $externalPrefixes) {
            $old2s = "require('../../" + $prefix + "/"
            $new3s = "require('../../../" + $prefix + "/"
            $old2d = 'require("../../' + $prefix + "/"
            $new3d = 'require("../../../' + $prefix + "/"
            $content = $content.Replace($old2s, $new3s)
            $content = $content.Replace($old2d, $new3d)
        }
    }

    # --------------------------------------------------------
    # CASE 3: Files in non-hots moved dirs at depth 1
    # (OnlineOrder/, event/, shortener/, searates/, _old/)
    # Fix: ../config/ → ../../config/
    # --------------------------------------------------------
    $nonHotsDirs = @('OnlineOrder', 'event', 'shortener', 'searates', '_old')
    $isInNonHots = $false
    foreach ($d in $nonHotsDirs) { if ($relativeToController -like "$d*") { $isInNonHots = $true; break } }

    if ($isInNonHots -and $depth -eq 1) {
        foreach ($prefix in $externalPrefixes) {
            $content = $content.Replace("require('../$prefix/", "require('../../$prefix/")
            $content = $content.Replace("require(`"../$prefix/", "require(`"../../$prefix/")
        }
    }

    # --------------------------------------------------------
    # CASE 4: Cross-module refs within hots_controller
    # Files deep inside hots_controller/X/controllers/ referencing
    # old paths like ../../../engine/ (should be ../../engine/)
    # --------------------------------------------------------
    if ($isInsideHotsController -and $depth -ge 2) {
        $hotsInternalDepth = $depth - 1  # depth within hots_controller
        $upToHotsRoot = ('../' * $hotsInternalDepth)       # up to hots_controller root
        $upToControllerRoot = ('../' * ($depth + 1))        # up to controller root (OLD, wrong)

        foreach ($module in $movedToHots) {
            # Old path pointed OUT of hots_controller to controller/module (wrong)
            $oldSingle = "require('$upToControllerRoot$module/"
            $newSingle = "require('$upToHotsRoot$module/"
            $oldDouble = "require(`"$upToControllerRoot$module/"
            $newDouble = "require(`"$upToHotsRoot$module/"
            $content = $content.Replace($oldSingle, $newSingle)
            $content = $content.Replace($oldDouble, $newDouble)
        }
    }

    if ($content -ne $original) {
        Set-Content $f.FullName $content -NoNewline -Encoding UTF8
        Write-Host "Fixed: $($f.FullName)"
        $totalFixed++
    }
}

Write-Host ""
Write-Host "=== Total files fixed: $totalFixed ==="
Write-Host "Run this script again after any future file moves."
