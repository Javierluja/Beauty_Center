# Script para arreglar todos los imports en api/
# Ejecuta esto en PowerShell en la raíz del proyecto

Write-Host "Arreglando imports en api/" -ForegroundColor Green

# 1. Cambiar @contracts a ../contracts
Get-ChildItem -Path api -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'from "@contracts/', 'from "../contracts/'
    Set-Content $_.FullName $content
}
Write-Host "✓ Cambiados imports @contracts" -ForegroundColor Green

# 2. Cambiar @db a ../../db
Get-ChildItem -Path api -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'from "@db/', 'from "../../db/'
    Set-Content $_.FullName $content
}
Write-Host "✓ Cambiados imports @db" -ForegroundColor Green

# 3. Agregar .js a todos los imports relativos (evitar duplicados)
Get-ChildItem -Path api -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Cambiar imports sin .js al final
    $content = $content -replace 'from "(\.\./[^"]+)"(?!\.js)', 'from "$1.js"'
    $content = $content -replace 'from "(\./[^"]+)"(?!\.js)', 'from "$1.js"'
    
    # Remover .js.js si existen
    $content = $content -replace '\.js\.js"', '.js"'
    
    Set-Content $_.FullName $content
}
Write-Host "✓ Agregados .js a imports relativos" -ForegroundColor Green

# 4. Mostrar resumen
Write-Host ""
Write-Host "=== Resumen de cambios ===" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "git add api/" -ForegroundColor White
Write-Host 'git commit -m "Fix: all imports corrected for Vercel"' -ForegroundColor White
Write-Host "git push" -ForegroundColor White
