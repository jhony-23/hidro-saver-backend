#!/usr/bin/env node

// Script de pruebas específico para validar compatibilidad con frontend
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_TEST_DATA = {
    admin: {
        nombre: 'AdminFrontend',
        contraseña: 'FrontendTest123!@#',
        email: 'frontend@test.com'
    },
    usuario: {
        nombre: 'Juan',
        apellido: 'Pérez',
        dpi: '1234567890123',
        sectorId: 1
    },
    sector: {
        nombre: 'Sector Frontend Test',
        descripcion: 'Sector creado desde frontend'
    },
    pago: {
        mes: '2025-10',
        monto: 50.00
    }
};

let authToken = null;
let testResults = [];

function logTest(name, success, details = '') {
    testResults.push({ name, success, details });
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} ${name}${details ? ': ' + details : ''}`);
}

async function testEndpoint(method, url, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) config.data = data;
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

async function runTests() {
    console.log('🚀 INICIANDO PRUEBAS DE COMPATIBILIDAD FRONTEND\n');

    // 1. Test de verificación de admin
    console.log('1️⃣ Probando verificación de admin...');
    const checkAdmin = await testEndpoint('GET', '/auth/check-admin');
    logTest('GET /auth/check-admin', checkAdmin.success, 
        checkAdmin.success ? `existenAdmins: ${checkAdmin.data.existenAdmins}` : checkAdmin.error);

    // 2. Test de registro de admin
    console.log('\n2️⃣ Probando registro de admin...');
    const registerAdmin = await testEndpoint('POST', '/auth/register-admin', FRONTEND_TEST_DATA.admin);
    logTest('POST /auth/register-admin', registerAdmin.success, 
        registerAdmin.success ? 'Admin creado' : registerAdmin.error);

    // 3. Test de login
    console.log('\n3️⃣ Probando login...');
    const login = await testEndpoint('POST', '/auth/login', {
        nombre: FRONTEND_TEST_DATA.admin.nombre,
        contraseña: FRONTEND_TEST_DATA.admin.contraseña
    });
    
    if (login.success) {
        authToken = login.data.token; // Frontend espera 'token'
        logTest('POST /auth/login', true, `Token obtenido: ${authToken ? 'SÍ' : 'NO'}`);
    } else {
        logTest('POST /auth/login', false, login.error);
        console.log('❌ No se pudo obtener token, saltando pruebas autenticadas');
        return;
    }

    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // 4. Test de sectores (público)
    console.log('\n4️⃣ Probando sectores públicos...');
    const sectores = await testEndpoint('GET', '/sectores');
    logTest('GET /sectores (público)', sectores.success,
        sectores.success ? `Campos: ${Object.keys(sectores.data.sectores[0] || {})}` : sectores.error);

    // 5. Test de crear sector
    console.log('\n5️⃣ Probando crear sector...');
    const createSector = await testEndpoint('POST', '/sectores', FRONTEND_TEST_DATA.sector, authHeaders);
    logTest('POST /sectores', createSector.success,
        createSector.success ? 'Sector creado con campos frontend' : createSector.error);

    // 6. Test de usuarios autenticados
    console.log('\n6️⃣ Probando usuarios autenticados...');
    const usuarios = await testEndpoint('GET', '/usuarios', null, authHeaders);
    logTest('GET /usuarios (autenticado)', usuarios.success,
        usuarios.success ? `Campos usuario: ${Object.keys(usuarios.data.usuarios[0] || {})}` : usuarios.error);

    // 7. Test de crear usuario
    console.log('\n7️⃣ Probando crear usuario...');
    const createUser = await testEndpoint('POST', '/usuarios/agregar', FRONTEND_TEST_DATA.usuario, authHeaders);
    let userCode = null;
    if (createUser.success) {
        userCode = createUser.data.usuario.codigo_barras || createUser.data.usuario.CodigoBarras;
        logTest('POST /usuarios/agregar', true, `Código generado: ${userCode}`);
    } else {
        logTest('POST /usuarios/agregar', false, createUser.error);
    }

    // 8. Test de buscar usuario por código
    if (userCode) {
        console.log('\n8️⃣ Probando buscar usuario por código...');
        const findUser = await testEndpoint('GET', `/usuarios/${userCode}`);
        logTest('GET /usuarios/:codigo', findUser.success,
            findUser.success ? 'Usuario encontrado con campos frontend' : findUser.error);

        // 9. Test de procesar pago
        console.log('\n9️⃣ Probando procesar pago...');
        const processPayment = await testEndpoint('POST', '/pagos', {
            codigoBarras: userCode, // Frontend usa este campo
            ...FRONTEND_TEST_DATA.pago
        }, authHeaders);
        logTest('POST /pagos', processPayment.success,
            processPayment.success ? `Resumen: ${processPayment.data.resumen ? 'SÍ' : 'NO'}` : processPayment.error);
    }

    // 10. Test de reportes
    console.log('\n🔟 Probando reportes...');
    const reporteMorosos = await testEndpoint('GET', `/reportes/morosos?periodo=${FRONTEND_TEST_DATA.pago.mes}`, null, authHeaders);
    logTest('GET /reportes/morosos', reporteMorosos.success,
        reporteMorosos.success ? `Morosos encontrados: ${reporteMorosos.data.morosos?.length || 0}` : reporteMorosos.error);

    const reporteGeneral = await testEndpoint('GET', `/reportes/general?periodo=${FRONTEND_TEST_DATA.pago.mes}`, null, authHeaders);
    logTest('GET /reportes/general', reporteGeneral.success,
        reporteGeneral.success ? `Total usuarios: ${reporteGeneral.data.resumen?.totalUsuarios || 0}` : reporteGeneral.error);

    const dashboard = await testEndpoint('GET', '/reportes/dashboard', null, authHeaders);
    logTest('GET /reportes/dashboard', dashboard.success,
        dashboard.success ? 'Dashboard KPIs disponibles' : dashboard.error);

    // Resumen final
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    const passed = testResults.filter(t => t.success).length;
    const total = testResults.length;
    console.log(`✅ Exitosas: ${passed}/${total}`);
    console.log(`❌ Fallidas: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El backend es compatible con el frontend.');
    } else {
        console.log('\n⚠️  Hay pruebas fallidas. Revisar incompatibilidades.');
    }
}

// Ejecutar pruebas
runTests().catch(console.error);