const rateLimit = require('express-rate-limit');
const { executeQuery } = require('../config/database');

// Rate limiting geral
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // máximo 100 requests por IP
    message: {
        error: 'Muitas requisições',
        message: 'Tente novamente em alguns minutos',
        code: 'RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`Rate limit excedido para IP: ${req.ip}`);
        res.status(429).json({
            error: 'Muitas requisições',
            message: 'Você excedeu o limite de requisições. Tente novamente em alguns minutos.',
            code: 'RATE_LIMITED',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

// Rate limiting para login (mais restritivo)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP
    skipSuccessfulRequests: true,
    message: {
        error: 'Muitas tentativas de login',
        message: 'Aguarde 15 minutos antes de tentar novamente',
        code: 'LOGIN_RATE_LIMITED'
    },
    handler: async (req, res) => {
        // Log da tentativa de abuso
        try {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    'WARN',
                    'security',
                    'rate_limit',
                    'Excesso de tentativas de login',
                    JSON.stringify({ ip: req.ip, userAgent: req.get('User-Agent') }),
                    req.ip
                ]
            );
        } catch (error) {
            console.error('Erro ao registrar rate limit abuse:', error);
        }
        
        res.status(429).json({
            error: 'Muitas tentativas de login',
            message: 'Você excedeu o limite de tentativas de login. Tente novamente em 15 minutos.',
            code: 'LOGIN_RATE_LIMITED',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

// Rate limiting para registro
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por IP por hora
    message: {
        error: 'Muitas tentativas de registro',
        message: 'Limite de registros por hora excedido',
        code: 'REGISTER_RATE_LIMITED'
    }
});

// Rate limiting para upload de arquivos
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // máximo 10 uploads por minuto
    message: {
        error: 'Muitos uploads',
        message: 'Limite de uploads por minuto excedido',
        code: 'UPLOAD_RATE_LIMITED'
    }
});

// Rate limiting para API pública
const publicApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // máximo 30 requests por minuto para APIs públicas
    message: {
        error: 'Rate limit excedido',
        message: 'Muitas requisições para API pública',
        code: 'PUBLIC_API_RATE_LIMITED'
    }
});

// Middleware personalizado para detectar comportamento suspeito
const suspiciousBehaviorDetector = async (req, res, next) => {
    try {
        const ip = req.ip;
        const userAgent = req.get('User-Agent') || '';
        const endpoint = req.path;
        
        // Lista de padrões suspeitos
        const suspiciousPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /hack/i,
            /sql/i,
            /script/i
        ];
        
        // Verificar User-Agent suspeito
        const isSuspiciousUA = suspiciousPatterns.some(pattern => pattern.test(userAgent));
        
        // Verificar endpoints sensíveis
        const sensitiveEndpoints = ['/api/admin', '/api/config', '/api/logs'];
        const isSensitiveEndpoint = sensitiveEndpoints.some(path => endpoint.startsWith(path));
        
        if (isSuspiciousUA || isSensitiveEndpoint) {
            // Registrar atividade suspeita
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, user_agent, endpoint) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    'WARN',
                    'security',
                    'suspicious_activity',
                    'Atividade suspeita detectada',
                    JSON.stringify({ 
                        reason: isSuspiciousUA ? 'suspicious_user_agent' : 'sensitive_endpoint',
                        userAgent: userAgent,
                        endpoint: endpoint 
                    }),
                    ip,
                    userAgent,
                    endpoint
                ]
            );
            
            // Para comportamento muito suspeito, bloquear
            if (isSuspiciousUA && isSensitiveEndpoint) {
                return res.status(403).json({
                    error: 'Acesso negado',
                    message: 'Atividade suspeita detectada',
                    code: 'SUSPICIOUS_ACTIVITY'
                });
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Erro no detector de comportamento suspeito:', error);
        // Continue mesmo com erro para não quebrar a aplicação
        next();
    }
};

// Middleware para verificar IP bloqueado
const checkBlockedIP = async (req, res, next) => {
    try {
        const ip = req.ip;
        
        // Verificar se o IP está na lista de bloqueados (pode ser uma tabela no banco)
        // Por enquanto, lista hardcoded de IPs problemáticos conhecidos
        const blockedIPs = [
            '127.0.0.2', // exemplo
            '0.0.0.0'    // exemplo
        ];
        
        if (blockedIPs.includes(ip)) {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    'ERROR',
                    'security',
                    'blocked_ip',
                    'Tentativa de acesso de IP bloqueado',
                    JSON.stringify({ ip: ip, endpoint: req.path }),
                    ip
                ]
            );
            
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Seu IP foi bloqueado',
                code: 'IP_BLOCKED'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Erro na verificação de IP bloqueado:', error);
        next(); // Continue mesmo com erro
    }
};

module.exports = {
    generalLimiter,
    loginLimiter,
    registerLimiter,
    uploadLimiter,
    publicApiLimiter,
    suspiciousBehaviorDetector,
    checkBlockedIP
};