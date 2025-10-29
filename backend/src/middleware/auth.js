const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware de autenticação JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                error: 'Token de acesso requerido',
                code: 'NO_TOKEN'
            });
        }
        
        // Verificar se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar se a sessão ainda está ativa
        const sessionQuery = `
            SELECT s.*, u.status as user_status, m.status as motoboy_status
            FROM sessoes s
            LEFT JOIN usuarios u ON s.usuario_id = u.id
            LEFT JOIN motoboys m ON s.motoboy_id = m.id
            WHERE s.token_hash = $1 
            AND s.ativa = true 
            AND s.data_expiracao > CURRENT_TIMESTAMP
        `;
        
        const tokenHash = require('crypto').createHash('md5').update(token).digest('hex');
        const sessionResult = await executeQuery(sessionQuery, [tokenHash]);
        
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Sessão inválida ou expirada',
                code: 'INVALID_SESSION'
            });
        }
        
        const session = sessionResult.rows[0];
        
        // Verificar se o usuário ainda está ativo
        if (session.usuario_id && session.user_status !== 'ativo') {
            return res.status(403).json({
                error: 'Usuário inativo',
                code: 'USER_INACTIVE'
            });
        }
        
        if (session.motoboy_id && session.motoboy_status !== 'ativo') {
            return res.status(403).json({
                error: 'Motoboy inativo',
                code: 'MOTOBOY_INACTIVE'
            });
        }
        
        // Atualizar último acesso
        await executeQuery(
            'UPDATE sessoes SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1',
            [session.id]
        );
        
        // Adicionar informações do usuário ao request
        req.user = {
            id: decoded.id,
            type: decoded.type, // 'usuario' ou 'motoboy'
            email: decoded.email,
            sessionId: session.id
        };
        
        next();
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(500).json({
            error: 'Erro interno de autenticação',
            code: 'AUTH_ERROR'
        });
    }
};

// Middleware para verificar tipo de usuário
const requireUserType = (requiredType) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuário não autenticado',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        if (req.user.type !== requiredType) {
            return res.status(403).json({
                error: `Acesso restrito a ${requiredType}s`,
                code: 'WRONG_USER_TYPE'
            });
        }
        
        next();
    };
};

// Middleware para usuários apenas
const requireUser = requireUserType('usuario');

// Middleware para motoboys apenas
const requireMotoboy = requireUserType('motoboy');

// Middleware para admin (usuário específico ou role)
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.type !== 'usuario') {
            return res.status(403).json({
                error: 'Acesso negado',
                code: 'ACCESS_DENIED'
            });
        }
        
        // Verificar se é admin (você pode usar uma tabela de roles ou email específico)
        const adminEmails = ['admin@droppoint.com'];
        
        const userResult = await executeQuery(
            'SELECT email FROM usuarios WHERE id = $1',
            [req.user.id]
        );
        
        if (userResult.rows.length === 0 || !adminEmails.includes(userResult.rows[0].email)) {
            return res.status(403).json({
                error: 'Privilégios de administrador requeridos',
                code: 'ADMIN_REQUIRED'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Erro na verificação de admin:', error);
        return res.status(500).json({
            error: 'Erro interno',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware opcional de autenticação (não falha se não houver token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            type: decoded.type,
            email: decoded.email
        };
        
        next();
        
    } catch (error) {
        // Em caso de erro, continua sem usuário autenticado
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireUser,
    requireMotoboy,
    requireAdmin,
    requireUserType,
    optionalAuth
};