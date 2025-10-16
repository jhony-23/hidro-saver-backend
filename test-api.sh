#!/bin/bash
# Script de pruebas para Hidro Saver Backend API

echo "🚀 Iniciando pruebas de Hidro Saver Backend API"
echo "================================================"

BASE_URL="http://localhost:3000"

echo ""
echo "1️⃣ Probando endpoint raíz..."
curl -s -X GET $BASE_URL/ | head -c 200
echo ""

echo ""
echo "2️⃣ Probando health check..."
curl -s -X GET $BASE_URL/health | head -c 200
echo ""

echo ""
echo "3️⃣ Probando verificación de admins..."
curl -s -X GET $BASE_URL/auth/check-admin | head -c 200
echo ""

echo ""
echo "4️⃣ Probando listado de sectores (público)..."
curl -s -X GET $BASE_URL/sectores | head -c 200
echo ""

echo ""
echo "5️⃣ Probando listado de usuarios (requiere auth - debería dar 401)..."
curl -s -X GET $BASE_URL/usuarios | head -c 200
echo ""

echo ""
echo "6️⃣ Probando endpoint inexistente (debería dar 404)..."
curl -s -X GET $BASE_URL/endpoint-inexistente | head -c 200
echo ""

echo ""
echo "🔐 Probando creación de primer administrador..."
curl -s -X POST $BASE_URL/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "AdminTest",
    "email": "admin@hidrosaver.com",
    "contraseña": "Admin123!@#"
  }' | head -c 300
echo ""

echo ""
echo "🔑 Probando login con las credenciales creadas..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "AdminTest",
    "contraseña": "Admin123!@#"
  }')

echo $LOGIN_RESPONSE | head -c 300
echo ""

# Extraer el token del response (simplificado para bash)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')

if [ ! -z "$TOKEN" ]; then
    echo ""
    echo "✅ Token obtenido, probando endpoints protegidos..."
    
    echo ""
    echo "7️⃣ Probando listado de usuarios con token..."
    curl -s -X GET $BASE_URL/usuarios \
      -H "Authorization: Bearer $TOKEN" | head -c 300
    echo ""
    
    echo ""
    echo "8️⃣ Probando listado de pagos con token..."
    curl -s -X GET $BASE_URL/pagos \
      -H "Authorization: Bearer $TOKEN" | head -c 300
    echo ""
    
    echo ""
    echo "9️⃣ Probando reporte de morosos con token..."
    curl -s -X GET "$BASE_URL/reportes/morosos?periodo=2025-10" \
      -H "Authorization: Bearer $TOKEN" | head -c 300
    echo ""
    
    echo ""
    echo "🔟 Probando dashboard con token..."
    curl -s -X GET $BASE_URL/reportes/dashboard \
      -H "Authorization: Bearer $TOKEN" | head -c 300
    echo ""
else
    echo "❌ No se pudo obtener el token de autenticación"
fi

echo ""
echo "================================================"
echo "✅ Pruebas completadas"