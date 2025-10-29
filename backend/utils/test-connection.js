const { Pool } = require('pg');
require('dotenv').config();

// Configuração para contornar problemas de SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
        sslmode: 'require'
    },
    max: 1,
    connectionTimeoutMillis: 10000,
});

async function testConnection() {
    try {
        console.log('🔄 Testando conexão com Neon DB...');
        
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados!');
        
        // Testar uma query simples
        const result = await client.query('SELECT NOW() as timestamp, version() as version');
        console.log('📅 Timestamp do servidor:', result.rows[0].timestamp);
        console.log('🗄️ Versão do PostgreSQL:', result.rows[0].version.split(' ')[0]);
        
        client.release();
        
        console.log('✅ Teste de conexão bem-sucedido!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        
        // Tentar com configuração alternativa
        console.log('🔄 Tentando configuração alternativa...');
        
        try {
            // Extrair dados da URL
            const url = new URL(process.env.DATABASE_URL);
            
            const alternativePool = new Pool({
                host: url.hostname,
                port: url.port || 5432,
                database: url.pathname.substring(1), // Remove a barra inicial
                user: url.username,
                password: url.password,
                ssl: {
                    rejectUnauthorized: false,
                    checkServerIdentity: () => undefined
                },
                max: 1,
                connectionTimeoutMillis: 10000,
            });
            
            const client = await alternativePool.connect();
            console.log('✅ Conectado com configuração alternativa!');
            
            const result = await client.query('SELECT NOW() as timestamp');
            console.log('📅 Timestamp:', result.rows[0].timestamp);
            
            client.release();
            await alternativePool.end();
            
            console.log('✅ Configuração alternativa funciona!');
            return true;
            
        } catch (altError) {
            console.error('❌ Configuração alternativa também falhou:', altError.message);
            return false;
        }
    } finally {
        await pool.end();
    }
}

// Executar teste
testConnection()
    .then(success => {
        if (success) {
            console.log('\n🎉 Banco de dados pronto para uso!');
            process.exit(0);
        } else {
            console.log('\n💥 Não foi possível conectar ao banco');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });