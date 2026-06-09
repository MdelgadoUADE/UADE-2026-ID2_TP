# Script de prueba para crear un reporte en PowerShell
# Uso: .\test-report-powershell.ps1

$body = @{
    user = @{
        user_id = "1"
        username = "testUser"
        surname = "User"
        email = "testuser@reportit.com"
    }
    is_anonymous = $false
    notes = "Este es un reporte de prueba con descripción detallada para verificar el trust score"
    tags = @{
        tipo_incidente = "test"
        prioridad = "alta"
    }
    report_location = @{
        type = "Point"
        coordinates = @(-58.3816, -34.6037)
    }
} | ConvertTo-Json -Depth 10

Write-Host "Enviando reporte..." -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/reports" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host "`nRespuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host

    if ($response.report.trust_score) {
        Write-Host "`n✓ Trust Score: $($response.report.trust_score)" -ForegroundColor Green
        Write-Host "✓ Metadata presente: $($response.report.trust_score_metadata -ne $null)" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Trust Score NO calculado (null)" -ForegroundColor Red
        Write-Host "Revisa los logs del backend para ver el error" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`nError al crear reporte:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Made with Bob
