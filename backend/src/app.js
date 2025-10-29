const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de origens permitidas
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'file://', // Para arquivos locais
        ];
        
        // Permitir requisições sem origin (ex: mobile apps, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middlewares globais
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware de log para desenvolvimento
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Rota de health check
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await testConnection();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV,
            database: dbStatus ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/motoboys', require('./routes/motoboys'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/avaliacoes', require('./routes/avaliacoes'));
app.use('/api/mensagens', require('./routes/mensagens'));
app.use('/api/notificacoes', require('./routes/notificacoes'));

// Rota para documentação da API
app.get('/api', (req, res) => {
    res.json({
        name: 'DropPoint API',
        version: '1.0.0',
        description: 'API para sistema de entregas DropPoint',
        endpoints: {
            health: '/api/health',
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                refresh: 'POST /api/auth/refresh'
            },
            usuarios: {
                profile: 'GET /api/usuarios/profile',
                update: 'PUT /api/usuarios/profile',
                orders: 'GET /api/usuarios/pedidos'
            },
            motoboys: {
                profile: 'GET /api/motoboys/profile',
                available: 'GET /api/motoboys/available',
                location: 'PUT /api/motoboys/location'
            },
            pedidos: {
                create: 'POST /api/pedidos',
                list: 'GET /api/pedidos',
                track: 'GET /api/pedidos/:id/track',
                update: 'PUT /api/pedidos/:id/status'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Middleware de tratamento de rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ Erro no servidor:', err.stack);
    
    // Erro de validação do CORS
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'Acesso negado pelo CORS',
            message: 'Origin não permitida'
        });
    }
    
    // Erro de JSON malformado
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'JSON inválido',
            message: 'Verifique a sintaxe do JSON enviado'
        });
    }
    
    // Erro de payload muito grande
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'Payload muito grande',
            message: 'Tamanho máximo permitido: 10MB'
        });
    }
    
    // Erro genérico
    res.status(err.status || 500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
    });
});

// Função para inicializar o servidor
async function startServer() {
    try {
        console.log('🚀 Iniciando DropPoint Backend...');
        console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
        console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
        
        // Conectar ao banco de dados
        await connectDB();
        
        // Testar conexão
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️  Servidor iniciado mas banco não conectado');
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('\n🎉 DropPoint Backend Online!');
            console.log(`📍 Servidor: http://localhost:${PORT}`);
            console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`📖 Documentação: http://localhost:${PORT}/api`);
            console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
            console.log('\n⚡ Pronto para receber requisições!\n');
        });
        
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Recebido ${signal}, encerrando servidor...`);
            
            server.close(() => {
                console.log('🔒 Servidor HTTP fechado');
                process.exit(0);
            });
            
            // Forçar encerramento após 30 segundos
            setTimeout(() => {
                console.error('💥 Forçando encerramento após timeout');
                process.exit(1);
            }, 30000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
    } catch (error) {
        console.error('💥 Falha crítica ao iniciar servidor:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Inicializar apenas se executado diretamente
if (require.main === module) {
    startServer();
}

module.exports = app;