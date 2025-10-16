# Script de pruebas para Hidro Saver Backend API
Write-Host "🚀 Iniciando pruebas de Hidro Saver Backend API" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Yellow

$BASE_URL = "http://localhost:3000"

# Función para hacer requests HTTP
function Test-Endpoint {
    param($Method, $Url, $Body = $null, $Headers = @{})
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $Body -ContentType "application/json" -Headers $Headers
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        return $response
    } catch {
        return @{ error = $_.Exception.Message; status = $_.Exception.Response.StatusCode }
    }
}

Write-Host ""
Write-Host "1️⃣ Probando endpoint raíz..." -ForegroundColor Cyan
$result1 = Test-Endpoint -Method "GET" -Url "$BASE_URL/"
Write-Host ($result1 | ConvertTo-Json -Compress) -ForegroundColor White

Write-Host ""
Write-Host "2️⃣ Probando health check..." -ForegroundColor Cyan
$result2 = Test-Endpoint -Method "GET" -Url "$BASE_URL/health"
Write-Host ($result2 | ConvertTo-Json -Compress) -ForegroundColor White

Write-Host ""
Write-Host "3️⃣ Probando verificación de admins..." -ForegroundColor Cyan
$result3 = Test-Endpoint -Method "GET" -Url "$BASE_URL/auth/check-admin"
Write-Host ($result3 | ConvertTo-Json -Compress) -ForegroundColor White

Write-Host ""
Write-Host "4️⃣ Probando listado de sectores (público)..." -ForegroundColor Cyan
$result4 = Test-Endpoint -Method "GET" -Url "$BASE_URL/sectores"
Write-Host ($result4 | ConvertTo-Json -Compress) -ForegroundColor White

Write-Host ""
Write-Host "5️⃣ Probando listado de usuarios (requiere auth - debería dar 401)..." -ForegroundColor Cyan
$result5 = Test-Endpoint -Method "GET" -Url "$BASE_URL/usuarios"
Write-Host ($result5 | ConvertTo-Json -Compress) -ForegroundColor White

Write-Host ""
Write-Host "🔐 Probando creación de primer administrador..." -ForegroundColor Magenta
$adminBody = @{
    nombre = "AdminTest"
    email = "admin@hidrosaver.com"
    contraseña = "Admin123!@#"
} | ConvertTo-Json

$createAdmin = Test-Endpoint -Method "POST" -Url "$BASE_URL/auth/register-admin" -Body $adminBody
Write-Host ($createAdmin | ConvertTo-Json -Compress) -ForegroundColor White

Write-Host ""
Write-Host "🔑 Probando login con las credenciales..." -ForegroundColor Magenta
$loginBody = @{
    nombre = "AdminTest"
    contraseña = "Admin123!@#"
} | ConvertTo-Json

$loginResult = Test-Endpoint -Method "POST" -Url "$BASE_URL/auth/login" -Body $loginBody
Write-Host ($loginResult | ConvertTo-Json -Compress) -ForegroundColor White

if ($loginResult.accessToken) {
    $token = $loginResult.accessToken
    $authHeaders = @{ "Authorization" = "Bearer $token" }
    
    Write-Host ""
    Write-Host "✅ Token obtenido, probando endpoints protegidos..." -ForegroundColor Green
    
    Write-Host ""
    Write-Host "7️⃣ Probando listado de usuarios con token..." -ForegroundColor Cyan
    $result7 = Test-Endpoint -Method "GET" -Url "$BASE_URL/usuarios" -Headers $authHeaders
    Write-Host ($result7 | ConvertTo-Json -Compress) -ForegroundColor White
    
    Write-Host ""
    Write-Host "8️⃣ Probando listado de pagos con token..." -ForegroundColor Cyan
    $result8 = Test-Endpoint -Method "GET" -Url "$BASE_URL/pagos" -Headers $authHeaders
    Write-Host ($result8 | ConvertTo-Json -Compress) -ForegroundColor White
    
    Write-Host ""
    Write-Host "9️⃣ Probando reporte de morosos con token..." -ForegroundColor Cyan
    $result9 = Test-Endpoint -Method "GET" -Url "$BASE_URL/reportes/morosos?periodo=2025-10" -Headers $authHeaders
    Write-Host ($result9 | ConvertTo-Json -Compress) -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔟 Probando dashboard con token..." -ForegroundColor Cyan
    $result10 = Test-Endpoint -Method "GET" -Url "$BASE_URL/reportes/dashboard" -Headers $authHeaders
    Write-Host ($result10 | ConvertTo-Json -Compress) -ForegroundColor White
} else {
    Write-Host "❌ No se pudo obtener el token de autenticación" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "✅ Pruebas completadas" -ForegroundColor Green