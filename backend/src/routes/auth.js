const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery } = require('../config/database');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Função para gerar token JWT
const generateToken = (user, type) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            type: type 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// Função para criar sessão
const createSession = async (userId, motoboyId, token, req) => {
    const tokenHash = crypto.createHash('md5').update(token).digest('hex');
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;
    
    // Extrair informações do User-Agent
    let dispositivo = 'Desconhecido';
    let navegador = 'Desconhecido';
    let sistemaOperacional = 'Desconhecido';
    
    if (userAgent.includes('Mobile')) dispositivo = 'Mobile';
    else if (userAgent.includes('Tablet')) dispositivo = 'Tablet';
    else dispositivo = 'Desktop';
    
    if (userAgent.includes('Chrome')) navegador = 'Chrome';
    else if (userAgent.includes('Firefox')) navegador = 'Firefox';
    else if (userAgent.includes('Safari')) navegador = 'Safari';
    else if (userAgent.includes('Edge')) navegador = 'Edge';
    
    if (userAgent.includes('Windows')) sistemaOperacional = 'Windows';
    else if (userAgent.includes('Mac')) sistemaOperacional = 'macOS';
    else if (userAgent.includes('Linux')) sistemaOperacional = 'Linux';
    else if (userAgent.includes('Android')) sistemaOperacional = 'Android';
    else if (userAgent.includes('iOS')) sistemaOperacional = 'iOS';
    
    const sessionResult = await executeQuery(
        `INSERT INTO sessoes (
            usuario_id, motoboy_id, token_hash, 
            dispositivo, navegador, sistema_operacional, ip_origem,
            data_expiracao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id`,
        [
            userId, motoboyId, tokenHash,
            dispositivo, navegador, sistemaOperacional, ip,
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        ]
    );
    
    return sessionResult.rows[0].id;
};

// ===== LOGIN DE USUÁRIO =====
router.post('/login/usuario', loginLimiter, async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios',
                code: 'MISSING_FIELDS'
            });
        }
        
        // Buscar usuário
        const userResult = await executeQuery(
            'SELECT id, nome, email, senha_hash, status, verificado FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Email ou senha incorretos',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        const user = userResult.rows[0];
        
        // Verificar status do usuário
        if (user.status !== 'ativo') {
            return res.status(403).json({
                error: 'Usuário inativo ou bloqueado',
                code: 'USER_INACTIVE'
            });
        }
        
        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        
        if (!senhaValida) {
            // Log da tentativa de login inválida
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, usuario_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    'WARN',
                    'auth',
                    'login',
                    'Tentativa de login com senha incorreta',
                    JSON.stringify({ email: email }),
                    req.ip,
                    user.id
                ]
            );
            
            return res.status(401).json({
                error: 'Email ou senha incorretos',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        // Gerar token
        const token = generateToken(user, 'usuario');
        
        // Criar sessão
        const sessionId = await createSession(user.id, null, token, req);
        
        // Atualizar última atividade
        await executeQuery(
            'UPDATE usuarios SET ultima_atividade = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Log do login bem-sucedido
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                'INFO',
                'auth',
                'login',
                'Login de usuário bem-sucedido',
                JSON.stringify({ sessionId: sessionId }),
                req.ip,
                user.id
            ]
        );
        
        res.json({
            message: 'Login realizado com sucesso',
            token: token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                verificado: user.verificado,
                type: 'usuario'
            }
        });
        
    } catch (error) {
        console.error('Erro no login de usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LOGIN DE MOTOBOY =====
router.post('/login/motoboy', loginLimiter, async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios',
                code: 'MISSING_FIELDS'
            });
        }
        
        const motoboyResult = await executeQuery(
            'SELECT id, nome, email, senha_hash, status, aprovado, verificado FROM motoboys WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (motoboyResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Email ou senha incorretos',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        const motoboy = motoboyResult.rows[0];
        
        if (motoboy.status !== 'ativo') {
            return res.status(403).json({
                error: 'Motoboy inativo ou bloqueado',
                code: 'MOTOBOY_INACTIVE'
            });
        }
        
        if (!motoboy.aprovado) {
            return res.status(403).json({
                error: 'Cadastro ainda não foi aprovado',
                code: 'NOT_APPROVED'
            });
        }
        
        const senhaValida = await bcrypt.compare(senha, motoboy.senha_hash);
        
        if (!senhaValida) {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, motoboy_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    'WARN',
                    'auth',
                    'login',
                    'Tentativa de login de motoboy com senha incorreta',
                    JSON.stringify({ email: email }),
                    req.ip,
                    motoboy.id
                ]
            );
            
            return res.status(401).json({
                error: 'Email ou senha incorretos',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        const token = generateToken(motoboy, 'motoboy');
        const sessionId = await createSession(null, motoboy.id, token, req);
        
        // Marcar motoboy como online
        await executeQuery(
            'UPDATE motoboys SET ultima_atividade = CURRENT_TIMESTAMP, online = true WHERE id = $1',
            [motoboy.id]
        );
        
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, motoboy_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                'INFO',
                'auth',
                'login',
                'Login de motoboy bem-sucedido',
                JSON.stringify({ sessionId: sessionId }),
                req.ip,
                motoboy.id
            ]
        );
        
        res.json({
            message: 'Login realizado com sucesso',
            token: token,
            motoboy: {
                id: motoboy.id,
                nome: motoboy.nome,
                email: motoboy.email,
                aprovado: motoboy.aprovado,
                verificado: motoboy.verificado,
                type: 'motoboy'
            }
        });
        
    } catch (error) {
        console.error('Erro no login de motoboy:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== REGISTRO DE USUÁRIO =====
router.post('/register/usuario', registerLimiter, async (req, res) => {
    try {
        const { nome, email, telefone, senha } = req.body;
        
        // Validações
        if (!nome || !email || !telefone || !senha) {
            return res.status(400).json({
                error: 'Todos os campos são obrigatórios',
                code: 'MISSING_FIELDS'
            });
        }
        
        if (senha.length < 6) {
            return res.status(400).json({
                error: 'Senha deve ter pelo menos 6 caracteres',
                code: 'WEAK_PASSWORD'
            });
        }
        
        // Verificar se email já existe
        const existingUser = await executeQuery(
            'SELECT id FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Email já cadastrado',
                code: 'EMAIL_EXISTS'
            });
        }
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS) || 12);
        
        // Inserir usuário
        const userResult = await executeQuery(
            `INSERT INTO usuarios (nome, email, telefone, senha_hash) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nome, email`,
            [nome.trim(), email.toLowerCase(), telefone, senhaHash]
        );
        
        const newUser = userResult.rows[0];
        
        // Gerar token
        const token = generateToken(newUser, 'usuario');
        
        // Criar sessão
        const sessionId = await createSession(newUser.id, null, token, req);
        
        // Log do registro
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                'INFO',
                'auth',
                'register',
                'Novo usuário registrado',
                JSON.stringify({ sessionId: sessionId }),
                req.ip,
                newUser.id
            ]
        );
        
        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            token: token,
            user: {
                id: newUser.id,
                nome: newUser.nome,
                email: newUser.email,
                verificado: false,
                type: 'usuario'
            }
        });
        
    } catch (error) {
        console.error('Erro no registro de usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== REGISTRO DE MOTOBOY =====
router.post('/register/motoboy', registerLimiter, async (req, res) => {
    try {
        const { 
            nome, email, telefone, cpf, cnh, senha,
            placaMoto, modeloMoto, corMoto, anoMoto 
        } = req.body;
        
        // Validações básicas
        const requiredFields = { nome, email, telefone, cpf, cnh, senha, placaMoto, modeloMoto };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
            
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                code: 'MISSING_FIELDS',
                fields: missingFields
            });
        }
        
        if (senha.length < 6) {
            return res.status(400).json({
                error: 'Senha deve ter pelo menos 6 caracteres',
                code: 'WEAK_PASSWORD'
            });
        }
        
        // Verificar duplicatas
        const duplicateCheck = await executeQuery(
            'SELECT email, cpf FROM motoboys WHERE email = $1 OR cpf = $2',
            [email.toLowerCase(), cpf]
        );
        
        if (duplicateCheck.rows.length > 0) {
            const duplicate = duplicateCheck.rows[0];
            if (duplicate.email === email.toLowerCase()) {
                return res.status(409).json({
                    error: 'Email já cadastrado',
                    code: 'EMAIL_EXISTS'
                });
            }
            if (duplicate.cpf === cpf) {
                return res.status(409).json({
                    error: 'CPF já cadastrado',
                    code: 'CPF_EXISTS'
                });
            }
        }
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS) || 12);
        
        // Inserir motoboy
        const motoboyResult = await executeQuery(
            `INSERT INTO motoboys (
                nome, email, telefone, cpf, cnh, senha_hash,
                placa_moto, modelo_moto, cor_moto, ano_moto
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING id, nome, email`,
            [
                nome.trim(), email.toLowerCase(), telefone, cpf, cnh, senhaHash,
                placaMoto.toUpperCase(), modeloMoto, corMoto, anoMoto
            ]
        );
        
        const newMotoboy = motoboyResult.rows[0];
        
        // Log do registro
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ip_origem, motoboy_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                'INFO',
                'auth',
                'register',
                'Novo motoboy registrado - aguardando aprovação',
                JSON.stringify({ 
                    placa: placaMoto.toUpperCase(),
                    modelo: modeloMoto 
                }),
                req.ip,
                newMotoboy.id
            ]
        );
        
        res.status(201).json({
            message: 'Motoboy registrado com sucesso. Aguarde aprovação.',
            motoboy: {
                id: newMotoboy.id,
                nome: newMotoboy.nome,
                email: newMotoboy.email,
                status: 'pendente',
                type: 'motoboy'
            }
        });
        
    } catch (error) {
        console.error('Erro no registro de motoboy:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LOGOUT =====
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const tokenHash = crypto.createHash('md5').update(token).digest('hex');
            
            // Desativar sessão
            await executeQuery(
                'UPDATE sessoes SET ativa = false WHERE token_hash = $1',
                [tokenHash]
            );
            
            // Se for motoboy, marcar como offline
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.type === 'motoboy') {
                    await executeQuery(
                        'UPDATE motoboys SET online = false WHERE id = $1',
                        [decoded.id]
                    );
                }
            } catch (err) {
                // Token inválido, mas continua o logout
            }
        }
        
        res.json({
            message: 'Logout realizado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== VERIFICAR TOKEN =====
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                valid: false,
                error: 'Token não fornecido'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tokenHash = crypto.createHash('md5').update(token).digest('hex');
        
        // Verificar se a sessão ainda é válida
        const sessionResult = await executeQuery(
            'SELECT ativa FROM sessoes WHERE token_hash = $1',
            [tokenHash]
        );
        
        if (sessionResult.rows.length === 0 || !sessionResult.rows[0].ativa) {
            return res.status(401).json({
                valid: false,
                error: 'Sessão inválida'
            });
        }
        
        res.json({
            valid: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                type: decoded.type
            }
        });
        
    } catch (error) {
        console.error('Erro na verificação de token:', error);
        res.status(401).json({
            valid: false,
            error: 'Token inválido'
        });
    }
});

module.exports = router;