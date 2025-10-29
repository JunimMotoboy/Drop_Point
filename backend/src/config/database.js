const { Pool } = require('pg');
require('dotenv').config();

// Função para extrair configurações da URL
function parseConnectionString(connectionString) {
    const url = new URL(connectionString);
    return {
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.substring(1),
        user: url.username,
        password: url.password
    };
}

// Configuração do pool de conexões com Neon DB
const config = parseConnectionString(process.env.DATABASE_URL);
const poolConfig = {
    ...config,
    ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

// Pool principal
const pool = new Pool(poolConfig);

// Configuração alternativa para ambientes restritivos
const alternativeConfig = {
    host: process.env.NEON_HOST,
    database: process.env.NEON_DATABASE,
    user: process.env.NEON_USERNAME,
    password: process.env.NEON_PASSWORD,
    port: 5432,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const alternativePool = new Pool(alternativeConfig);

// Função para conectar ao banco
const connectDB = async () => {
    let connectionPool = pool;
    
    try {
        console.log('🔌 Tentando conectar ao Neon Database...');
        
        // Tentar conexão principal primeiro
        const client = await pool.connect();
        console.log('✅ Conectado ao Neon Database via connection string');
        client.release();
        
        return pool;
    } catch (error) {
        console.warn('⚠️  Falha na conexão principal, tentando configuração alternativa...');
        console.warn('Erro:', error.message);
        
        try {
            // Tentar configuração alternativa
            const client = await alternativePool.connect();
            console.log('✅ Conectado ao Neon Database via configuração alternativa');
            client.release();
            connectionPool = alternativePool;
            
            return alternativePool;
        } catch (altError) {
            console.error('❌ Falha em ambas as configurações de conexão:');
            console.error('Erro principal:', error.message);
            console.error('Erro alternativo:', altError.message);
            
            // Verificações de diagnóstico
            console.log('\n🔍 Diagnóstico de Conexão:');
            console.log('DATABASE_URL definida:', !!process.env.DATABASE_URL);
            console.log('NEON_HOST definido:', !!process.env.NEON_HOST);
            console.log('NODE_ENV:', process.env.NODE_ENV);
            
            throw new Error('Não foi possível conectar ao banco de dados');
        }
    }
};

// Função para testar conexão
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
        console.log('🕒 Horário do banco:', result.rows[0].current_time);
        console.log('🐘 Versão PostgreSQL:', result.rows[0].db_version.split(' ')[0]);
        return true;
    } catch (error) {
        console.error('❌ Erro no teste de conexão:', error.message);
        return false;
    }
};

// Função para executar queries com tratamento de erro
const executeQuery = async (text, params = []) => {
    const client = await pool.connect();
    try {
        const start = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        
        // Log de queries em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Query executada:', { text, duration: `${duration}ms`, rows: result.rowCount });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        console.error('Query:', text);
        throw error;
    } finally {
        client.release();
    }
};

// Função para transações
const executeTransaction = async (queries) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const results = [];
        for (const { text, params } of queries) {
            const result = await client.query(text, params);
            results.push(result);
        }
        
        await client.query('COMMIT');
        console.log('✅ Transação executada com sucesso');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro na transação, rollback executado:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

// Graceful shutdown
const closeConnection = async () => {
    try {
        await pool.end();
        if (alternativePool !== pool) {
            await alternativePool.end();
        }
        console.log('🔐 Conexões com banco fechadas');
    } catch (error) {
        console.error('❌ Erro ao fechar conexões:', error.message);
    }
};

// Event listeners para graceful shutdown
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
    pool,
    connectDB,
    testConnection,
    executeQuery,
    executeTransaction,
    closeConnection
};