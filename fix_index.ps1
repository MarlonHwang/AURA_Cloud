$content = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AURA Cloud</title>
</head>
<body>
    <div id="root"></div>
    <div id="copilot-root"></div>
    <div id="timeline-root"></div>
    <script type="module" src="./main.ts"></script>
</body>
</html>
"@
Set-Content -Path "src\renderer\index.html" -Value $content -Encoding UTF8
Write-Host "Index.html restored with ./main.ts and correct DOM structure"
