$path = "src/renderer/index.html"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Define patterns to replace (covering possible variations in Git)
$patterns = @('src="/src/renderer/main.ts"', 'src="/main.ts"', 'src="./src/renderer/main.ts"')
$replacement = 'src="./main.ts"'

foreach ($pattern in $patterns) {
    if ($content -match [regex]::Escape($pattern)) {
        $content = $content -replace [regex]::Escape($pattern), $replacement
        Write-Host "Replaced '$pattern' with '$replacement'"
    }
}

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "Patched $path successfully."
