$files = @(
    @{
        Path          = "d:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller\OnlineOrder\auth.js"
        LoggerRequire = "const log = require('../../core/logger');"
        LoggerPrefix  = "log.eorder"
    },
    @{
        Path          = "d:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller\hots_controller\auth\controllers\authController.js"
        LoggerRequire = "const log = require('../../../../core/logger');"
        LoggerPrefix  = "log.hots"
    }
)

foreach ($f in $files) {
    if (-not (Test-Path $f.Path)) {
        Write-Host "File not found: $($f.Path)"
        continue
    }

    $content = Get-Content $f.Path -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    # Inject logger require if not present
    if ($content -notmatch "require\(['`""]((\.\./) + )core/logger['`""]\)") {
        # Find first require statement to insert after
        $content = $content -replace "(const .* = require\(.*?\);?)", "`$1`n$($f.LoggerRequire)"
    }

    # Replace console.log -> log.eorder.info
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, 'console\.log\s*\(([^)]+)\)', "$($f.LoggerPrefix).info(`$1)")
    
    # Replace console.warn -> log.eorder.warn
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, 'console\.warn\s*\(([^)]+)\)', "$($f.LoggerPrefix).warn(`$1)")
    
    # Replace console.error -> log.eorder.error
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, 'console\.error\s*\(([^)]+)\)', "$($f.LoggerPrefix).error(`$1)")

    # The user also has "console.log(...);" we can also catch those without trailing semicolon using the above regex since it captures inside parens
    # Also need to remove manual timestamps like "timestamp +" or "timestamp," from within the log messages

    # Fix formatting issues like empty string concatenation caused by timestamp removal (if user had it)
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, '(log\.[a-z]+\.(?:info | warn | error)\()timestamp\s*\+\s*', '$1')
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, '(log\.[a-z]+\.(?:info | warn | error)\()req\.dataToken\.timestamp\s*\+\s*', '$1')
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, '(log\.[a-z]+\.(?:info | warn | error)\()timestamp\s*, \s*', '$1')

    if ($content -ne $original) {
        Set-Content $f.Path $content -NoNewline -Encoding UTF8
        Write-Host "Updated: $($f.Path)"
    } else {
        Write-Host "No changes: $($f.Path)"
    }
}
Write-Host "Done!"
