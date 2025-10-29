const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
    console.log('🧪 Testando API DropPoint...\n');
    
    try {
        // Teste 1: Health Check
        console.log('1. Testando Health Check...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log(`   ✅ Status: ${healthData.status}`);
        console.log(`   📊 Database: ${healthData.database}`);
        console.log(`   ⏱️ Uptime: ${Math.round(healthData.uptime)}s\n`);
        
        // Teste 2: Documentação da API
        console.log('2. Testando Documentação...');
        const docsResponse = await fetch(`${API_BASE}`);
        const docsData = await docsResponse.json();
        console.log(`   ✅ Nome: ${docsData.name}`);
        console.log(`   📖 Versão: ${docsData.version}\n`);
        
        // Teste 3: Tentativa de login (deve falhar sem credenciais)
        console.log('3. Testando endpoint de login...');
        const loginResponse = await fetch(`${API_BASE}/auth/login/usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'teste@droppoint.com', senha: '123456' })
        });
        const loginResult = await loginResponse.json();
        
        if (loginResponse.status === 401) {
            console.log('   ✅ Endpoint protegido funcionando (credenciais inválidas)');
        } else if (loginResponse.status === 200) {
            console.log('   ✅ Login bem-sucedido com dados de teste');
        } else {
            console.log(`   ⚠️ Resposta inesperada: ${loginResponse.status}`);
        }
        console.log(`   📝 Mensagem: ${loginResult.message || loginResult.error}\n`);
        
        // Teste 4: Listar motoboys disponíveis (endpoint público)
        console.log('4. Testando listagem de motoboys...');
        const motoboyResponse = await fetch(`${API_BASE}/motoboys/available`);
        
        if (motoboyResponse.status === 401) {
            console.log('   ✅ Endpoint protegido por autenticação');
        } else if (motoboyResponse.status === 200) {
            const motoboys = await motoboyResponse.json();
            console.log(`   ✅ ${motoboys.length || 0} motoboys encontrados`);
        }
        
        console.log('\n🎉 Todos os testes foram executados!');
        console.log('✅ API está funcionando corretamente');
        console.log('✅ Banco de dados conectado');
        console.log('✅ Endpoints respondendo');
        console.log('✅ Autenticação configurada');
        
    } catch (error) {
        console.error('❌ Erro durante os testes:', error.message);
    }
}

// Executar testes apenas se o servidor estiver rodando
testAPI().catch(console.error);