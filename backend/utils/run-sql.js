const fs = require('fs');
const path = require('path');
const { pool, connectDB } = require('../src/config/database');

async function runSqlFile(filename) {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await connectDB();
        
        const sqlPath = path.join(__dirname, filename);
        
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Arquivo SQL não encontrado: ${sqlPath}`);
        }
        
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log(`📄 Executando ${filename}...`);
        console.log(`📏 Tamanho do arquivo: ${(sql.length / 1024).toFixed(2)} KB`);
        
        const startTime = Date.now();
        
        // Executar o SQL
        const result = await pool.query(sql);
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ ${filename} executado com sucesso!`);
        console.log(`⏱️  Tempo de execução: ${duration}ms`);
        
        if (result.rowCount !== undefined) {
            console.log(`📊 Linhas afetadas: ${result.rowCount}`);
        }
        
        // Mostrar algumas estatísticas se for o seed
        if (filename.includes('seed')) {
            await showSeedStats();
        }
        
    } catch (error) {
        console.error(`❌ Erro ao executar ${filename}:`);
        console.error('📋 Detalhes:', error.message);
        
        if (error.position) {
            console.error(`📍 Posição do erro: ${error.position}`);
        }
        
        if (error.hint) {
            console.error(`💡 Dica: ${error.hint}`);
        }
        
        process.exit(1);
    } finally {
        try {
            await pool.end();
            console.log('🔐 Conexão com banco fechada');
        } catch (closeError) {
            console.error('⚠️  Erro ao fechar conexão:', closeError.message);
        }
    }
}

async function showSeedStats() {
    try {
        console.log('\n📈 Estatísticas dos dados inseridos:');
        
        // Contar registros nas principais tabelas
        const tables = [
            'usuarios',
            'motoboys', 
            'pedidos',
            'avaliacoes',
            'mensagens',
            'notificacoes',
            'configuracoes'
        ];
        
        for (const table of tables) {
            try {
                const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = result.rows[0].count;
                console.log(`   ${table.padEnd(15)}: ${count} registros`);
            } catch (err) {
                console.log(`   ${table.padEnd(15)}: erro ao contar`);
            }
        }
        
        // Mostrar pedidos por status
        try {
            const statusResult = await pool.query(`
                SELECT status, COUNT(*) as count 
                FROM pedidos 
                GROUP BY status 
                ORDER BY count DESC
            `);
            
            console.log('\n📦 Pedidos por status:');
            statusResult.rows.forEach(row => {
                console.log(`   ${row.status.padEnd(15)}: ${row.count}`);
            });
        } catch (err) {
            console.log('   Erro ao contar pedidos por status');
        }
        
        // Mostrar motoboys por status
        try {
            const motoboyResult = await pool.query(`
                SELECT status, COUNT(*) as count 
                FROM motoboys 
                GROUP BY status 
                ORDER BY count DESC
            `);
            
            console.log('\n🏍️  Motoboys por status:');
            motoboyResult.rows.forEach(row => {
                console.log(`   ${row.status.padEnd(15)}: ${row.count}`);
            });
        } catch (err) {
            console.log('   Erro ao contar motoboys por status');
        }
        
    } catch (error) {
        console.log('⚠️  Erro ao gerar estatísticas:', error.message);
    }
}

// Validar argumentos
const sqlFile = process.argv[2];

if (!sqlFile) {
    console.error('❌ Uso incorreto!');
    console.log('\n📖 Como usar:');
    console.log('   node run-sql.js <arquivo.sql>');
    console.log('\n📝 Exemplos:');
    console.log('   node run-sql.js create_tables.sql');
    console.log('   node run-sql.js seed_data.sql');
    console.log('\n📂 Arquivos disponíveis:');
    
    try {
        const files = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.sql'))
            .sort();
            
        files.forEach(file => {
            console.log(`   - ${file}`);
        });
    } catch (err) {
        console.log('   Erro ao listar arquivos SQL');
    }
    
    process.exit(1);
}

// Validar se o arquivo existe
const fullPath = path.join(__dirname, sqlFile);
if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${sqlFile}`);
    console.log(`📍 Procurado em: ${fullPath}`);
    
    // Sugerir arquivos similares
    try {
        const files = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.sql'));
            
        const similar = files.filter(file => 
            file.toLowerCase().includes(sqlFile.toLowerCase().replace('.sql', ''))
        );
        
        if (similar.length > 0) {
            console.log('\n💡 Arquivos similares encontrados:');
            similar.forEach(file => console.log(`   - ${file}`));
        }
    } catch (err) {
        // Ignorar erros de listagem
    }
    
    process.exit(1);
}

// Executar o arquivo SQL
runSqlFile(sqlFile);