# Script simple de pruebas para debugging
Write-Host "🚀 Pruebas básicas de Hidro Saver Backend" -ForegroundColor Green

# Verificar si el servidor está corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Servidor responde: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Contenido: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Error al conectar con el servidor: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar health check
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Health check: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "Respuesta: $($health.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Error en health check: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar check-admin
try {
    $admin = Invoke-WebRequest -Uri "http://localhost:3000/auth/check-admin" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Check admin: $($admin.StatusCode)" -ForegroundColor Green
    Write-Host "Respuesta: $($admin.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Error en check admin: $($_.Exception.Message)" -ForegroundColor Red
}