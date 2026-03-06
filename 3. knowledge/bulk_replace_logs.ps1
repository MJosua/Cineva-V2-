param([string]$file)

if (-not $file) {
    $file = 'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\controller\OnlineOrder\order.js'
}

Write-Host "Processing: $file"
$content = Get-Content $file -Raw -Encoding UTF8

# Remove legacy timestamp variable declarations (3 patterns)
$content = $content -replace '(?m)^[ \t]*let date = new Date\(\);[ \t]*\r?\n', ''
$content = $content -replace '(?m)^[ \t]*let timestamp = green \+[^\r\n]+\r?\n', ''
$content = $content -replace '(?m)^[ \t]*// timestamp \+[ \t]*\r?\n', ''

# Replace console.log with log.eorder.info
$content = $content -replace 'console\.log\(timestamp \+ ', 'log.eorder.info('
$content = $content -replace 'console\.log\(timestamp, ', 'log.eorder.info('
$content = $content -replace 'console\.log\(timestamp\)', 'log.eorder.info("")'
$content = $content -replace 'console\.log\(white \+ ', 'log.eorder.info('
$content = $content -replace 'console\.log\(green \+ ', 'log.eorder.info('
$content = $content -replace 'console\.error\(err\)', 'log.eorder.error(err)'
$content = $content -replace 'console\.error\(', 'log.eorder.error('

# Fix any remaining standalone console.log that still reference old timestamp var
$content = $content -replace 'log\.eorder\.info\(timestamp ', 'log.eorder.info('
$content = $content -replace 'log\.eorder\.info\(timestamp\)', 'log.eorder.info("")'

Set-Content $file $content -NoNewline -Encoding UTF8
Write-Host "Done."

$remaining = (Select-String -Path $file -Pattern 'console\.(log|error|warn)' | Measure-Object).Count
Write-Host "Remaining console.* calls: $remaining"
