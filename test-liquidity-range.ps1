# Script para probar el endpoint /api/liquidity-range
$body = @{
    tokenA = "ETHUSDT"
    tokenB = "LINKUSDT"
    rangeUpPercent = 5
    rangeDownPercent = 5
    timePeriod = 100
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Enviando petición a /api/liquidity-range..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/liquidity-range" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "`n✅ Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
