const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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

async function setupDatabase() {
    console.log('🚀 Iniciando configuração do banco de dados...');
    
    // Configuração do pool
    const config = parseConnectionString(process.env.DATABASE_URL);
    const pool = new Pool({
        ...config,
        ssl: {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined
        },
        max: 1,
        connectionTimeoutMillis: 10000,
    });
    
    try {
        console.log('🔄 Conectando ao banco...');
        const client = await pool.connect();
        console.log('✅ Conectado com sucesso!');
        
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'scripts', 'create_tables.sql');
        console.log('📖 Lendo script SQL:', sqlPath);
        
        if (!fs.existsSync(sqlPath)) {
            throw new Error('Arquivo create_tables.sql não encontrado');
        }
        
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        console.log('📄 Script carregado, executando...');
        
        // Executar o SQL
        await client.query(sqlContent);
        console.log('✅ Tabelas criadas com sucesso!');
        
        // Verificar tabelas criadas
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('\n📋 Tabelas criadas:');
        tablesResult.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });
        
        // Inserir dados de teste (opcional)
        console.log('\n🧪 Inserindo dados de teste...');
        
        // Usuário de teste
        await client.query(`
            INSERT INTO usuarios (nome, email, senha_hash, telefone, endereco_principal) 
            VALUES (
                'Usuário Teste', 
                'teste@droppoint.com', 
                '$2b$12$example.hash.for.password.123456',
                '(11) 99999-9999',
                'Rua Teste, 123 - São Paulo, SP - 01234-567'
            ) ON CONFLICT (email) DO NOTHING
        `);
        
        // Motoboy de teste
        await client.query(`
            INSERT INTO motoboys (nome, email, senha_hash, telefone, cpf, cnh, placa_moto, modelo_moto) 
            VALUES (
                'Motoboy Teste', 
                'motoboy@droppoint.com', 
                '$2b$12$example.hash.for.password.123456',
                '(11) 88888-8888',
                '123.456.789-00',
                '12345678900',
                'ABC1234',
                'Honda CG 160'
            ) ON CONFLICT (email) DO NOTHING
        `);
        
        console.log('✅ Dados de teste inseridos!');
        
        client.release();
        
        console.log('\n🎉 Banco de dados configurado com sucesso!');
        console.log('📊 Resumo:');
        console.log(`  • Tabelas: ${tablesResult.rows.length}`);
        console.log('  • Dados de teste: Inseridos');
        console.log('  • Status: Pronto para uso');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar configuração
setupDatabase()
    .then(() => {
        console.log('\n✅ Configuração finalizada!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Falha na configuração:', error);
        process.exit(1);
    });