const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ===== CRIAR NOTIFICAÇÃO =====
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            usuario_id,
            motoboy_id,
            tipo_notificacao,
            titulo,
            conteudo,
            pedido_id,
            prioridade = 'media',
            acao_link,
            acao_texto,
            data_expiracao
        } = req.body;
        
        // Validações básicas
        if (!titulo || titulo.trim().length === 0) {
            return res.status(400).json({
                error: 'Título é obrigatório',
                code: 'MISSING_TITLE'
            });
        }
        
        if (!conteudo || conteudo.trim().length === 0) {
            return res.status(400).json({
                error: 'Conteúdo é obrigatório',
                code: 'MISSING_CONTENT'
            });
        }
        
        // Validar tipo de notificação
        const tiposValidos = [
            'pedido_novo', 'pedido_aceito', 'pedido_em_transito', 'pedido_entregue',
            'pedido_cancelado', 'mensagem_nova', 'avaliacao_recebida', 'sistema',
            'promocao', 'lembrete', 'alerta'
        ];
        
        if (!tipo_notificacao || !tiposValidos.includes(tipo_notificacao)) {
            return res.status(400).json({
                error: 'Tipo de notificação inválido',
                code: 'INVALID_NOTIFICATION_TYPE',
                valid_types: tiposValidos
            });
        }
        
        // Validar prioridade
        const prioridadesValidas = ['baixa', 'media', 'alta', 'urgente'];
        if (!prioridadesValidas.includes(prioridade)) {
            return res.status(400).json({
                error: 'Prioridade inválida',
                code: 'INVALID_PRIORITY',
                valid_priorities: prioridadesValidas
            });
        }
        
        // Validar destinatário
        if (!usuario_id && !motoboy_id) {
            return res.status(400).json({
                error: 'Deve especificar pelo menos um destinatário (usuario_id ou motoboy_id)',
                code: 'MISSING_RECIPIENT'
            });
        }
        
        // Se especificou pedido, verificar se existe
        if (pedido_id) {
            const pedidoResult = await executeQuery(
                'SELECT id FROM pedidos WHERE id = $1',
                [pedido_id]
            );
            
            if (pedidoResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Pedido não encontrado',
                    code: 'ORDER_NOT_FOUND'
                });
            }
        }
        
        // Inserir notificação
        const result = await executeQuery(
            `INSERT INTO notificacoes (
                usuario_id, motoboy_id, tipo_notificacao, titulo, conteudo,
                pedido_id, prioridade, acao_link, acao_texto, data_expiracao,
                remetente_tipo, remetente_id, ip_origem
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, timestamp_criacao`,
            [
                usuario_id, motoboy_id, tipo_notificacao, titulo.trim(), conteudo.trim(),
                pedido_id, prioridade, acao_link, acao_texto, data_expiracao,
                req.user.type, req.user.id, req.ip
            ]
        );
        
        const novaNotificacao = result.rows[0];
        
        // Log da notificação
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ${req.user.type === 'usuario' ? 'usuario_id' : 'motoboy_id'}) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'notificacoes',
                'create',
                'Nova notificação criada',
                JSON.stringify({
                    notificacao_id: novaNotificacao.id,
                    tipo_notificacao: tipo_notificacao,
                    destinatario_usuario: usuario_id,
                    destinatario_motoboy: motoboy_id,
                    prioridade: prioridade
                }),
                req.user.id
            ]
        );
        
        res.status(201).json({
            message: 'Notificação criada com sucesso',
            notificacao: {
                id: novaNotificacao.id,
                timestamp_criacao: novaNotificacao.timestamp_criacao
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR NOTIFICAÇÕES DO USUÁRIO =====
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            limit = 20, 
            offset = 0, 
            tipo, 
            lida, 
            prioridade,
            apenas_nao_expiradas = true 
        } = req.query;
        
        // Construir query dinâmica
        let whereClause = '';
        const values = [];
        let paramCount = 1;
        
        if (req.user.type === 'usuario') {
            whereClause += `WHERE usuario_id = $${paramCount++}`;
            values.push(req.user.id);
        } else if (req.user.type === 'motoboy') {
            whereClause += `WHERE motoboy_id = $${paramCount++}`;
            values.push(req.user.id);
        }
        
        // Filtrar por tipo
        if (tipo) {
            whereClause += ` AND tipo_notificacao = $${paramCount++}`;
            values.push(tipo);
        }
        
        // Filtrar por status lida
        if (lida !== undefined) {
            const isLida = lida === 'true' || lida === '1';
            whereClause += ` AND lida = $${paramCount++}`;
            values.push(isLida);
        }
        
        // Filtrar por prioridade
        if (prioridade) {
            whereClause += ` AND prioridade = $${paramCount++}`;
            values.push(prioridade);
        }
        
        // Excluir expiradas por padrão
        if (apenas_nao_expiradas === 'true' || apenas_nao_expiradas === true) {
            whereClause += ` AND (data_expiracao IS NULL OR data_expiracao > CURRENT_TIMESTAMP)`;
        }
        
        const result = await executeQuery(
            `SELECT 
                id, tipo_notificacao, titulo, conteudo, prioridade,
                pedido_id, acao_link, acao_texto, lida, timestamp_leitura,
                timestamp_criacao, data_expiracao,
                CASE 
                    WHEN data_expiracao IS NOT NULL AND data_expiracao <= CURRENT_TIMESTAMP THEN true
                    ELSE false
                END as expirada
             FROM notificacoes
             ${whereClause}
             ORDER BY 
                CASE prioridade 
                    WHEN 'urgente' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    WHEN 'baixa' THEN 4
                END,
                lida ASC,
                timestamp_criacao DESC
             LIMIT $${paramCount++} OFFSET $${paramCount}`,
            [...values, parseInt(limit), parseInt(offset)]
        );
        
        // Contar total
        const countResult = await executeQuery(
            `SELECT COUNT(*) as total FROM notificacoes ${whereClause}`,
            values
        );
        
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            notificacoes: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: total
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar notificações:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== MARCAR NOTIFICAÇÃO COMO LIDA =====
router.patch('/:id/marcar-lida', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se a notificação existe e pertence ao usuário
        const whereClause = req.user.type === 'usuario' 
            ? 'usuario_id = $2' 
            : 'motoboy_id = $2';
            
        const notificacaoResult = await executeQuery(
            `SELECT id, lida FROM notificacoes WHERE id = $1 AND ${whereClause}`,
            [id, req.user.id]
        );
        
        if (notificacaoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Notificação não encontrada',
                code: 'NOTIFICATION_NOT_FOUND'
            });
        }
        
        const notificacao = notificacaoResult.rows[0];
        
        if (notificacao.lida) {
            return res.status(400).json({
                error: 'Notificação já foi lida',
                code: 'ALREADY_READ'
            });
        }
        
        // Marcar como lida
        await executeQuery(
            `UPDATE notificacoes 
             SET lida = true, timestamp_leitura = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );
        
        res.json({
            message: 'Notificação marcada como lida',
            notificacao_id: id
        });
        
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS =====
router.patch('/marcar-todas-lidas', authenticateToken, async (req, res) => {
    try {
        const whereClause = req.user.type === 'usuario' 
            ? 'usuario_id = $1' 
            : 'motoboy_id = $1';
            
        const updateResult = await executeQuery(
            `UPDATE notificacoes 
             SET lida = true, timestamp_leitura = CURRENT_TIMESTAMP
             WHERE ${whereClause} AND lida = false`,
            [req.user.id]
        );
        
        res.json({
            message: 'Todas as notificações foram marcadas como lidas',
            notificacoes_atualizadas: updateResult.rowCount
        });
        
    } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== EXCLUIR NOTIFICAÇÃO =====
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se a notificação existe e pertence ao usuário
        const whereClause = req.user.type === 'usuario' 
            ? 'usuario_id = $2' 
            : 'motoboy_id = $2';
            
        const notificacaoResult = await executeQuery(
            `SELECT id FROM notificacoes WHERE id = $1 AND ${whereClause}`,
            [id, req.user.id]
        );
        
        if (notificacaoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Notificação não encontrada',
                code: 'NOTIFICATION_NOT_FOUND'
            });
        }
        
        // Excluir notificação
        await executeQuery('DELETE FROM notificacoes WHERE id = $1', [id]);
        
        // Log da exclusão
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ${req.user.type === 'usuario' ? 'usuario_id' : 'motoboy_id'}) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'notificacoes',
                'delete',
                'Notificação excluída',
                JSON.stringify({ notificacao_id: id }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Notificação excluída com sucesso',
            notificacao_id: id
        });
        
    } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== OBTER CONTADOR DE NOTIFICAÇÕES NÃO LIDAS =====
router.get('/nao-lidas/contador', authenticateToken, async (req, res) => {
    try {
        const whereClause = req.user.type === 'usuario' 
            ? 'usuario_id = $1' 
            : 'motoboy_id = $1';
        
        // Contar por tipo
        const result = await executeQuery(
            `SELECT 
                tipo_notificacao,
                COUNT(*) as quantidade,
                SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgentes
             FROM notificacoes
             WHERE ${whereClause} 
             AND lida = false 
             AND (data_expiracao IS NULL OR data_expiracao > CURRENT_TIMESTAMP)
             GROUP BY tipo_notificacao`,
            [req.user.id]
        );
        
        // Total geral
        const totalResult = await executeQuery(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgentes_total
             FROM notificacoes
             WHERE ${whereClause} 
             AND lida = false 
             AND (data_expiracao IS NULL OR data_expiracao > CURRENT_TIMESTAMP)`,
            [req.user.id]
        );
        
        const total = parseInt(totalResult.rows[0].total);
        const urgentesTotal = parseInt(totalResult.rows[0].urgentes_total || 0);
        
        res.json({
            total_nao_lidas: total,
            urgentes_total: urgentesTotal,
            por_tipo: result.rows.map(row => ({
                tipo: row.tipo_notificacao,
                quantidade: parseInt(row.quantidade),
                urgentes: parseInt(row.urgentes || 0)
            }))
        });
        
    } catch (error) {
        console.error('Erro ao buscar contador de notificações não lidas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== CONFIGURAÇÕES DE NOTIFICAÇÃO =====
router.get('/configuracoes', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT configuracoes_notificacao FROM ${req.user.type === 'usuario' ? 'usuarios' : 'motoboys'} WHERE id = $1`,
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const configuracoes = result.rows[0].configuracoes_notificacao || {
            pedido_novo: true,
            pedido_aceito: true,
            pedido_em_transito: true,
            pedido_entregue: true,
            pedido_cancelado: true,
            mensagem_nova: true,
            avaliacao_recebida: true,
            sistema: true,
            promocao: false,
            lembrete: true,
            som_ativo: true,
            vibrar_ativo: true
        };
        
        res.json({ configuracoes });
        
    } catch (error) {
        console.error('Erro ao buscar configurações de notificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ATUALIZAR CONFIGURAÇÕES DE NOTIFICAÇÃO =====
router.patch('/configuracoes', authenticateToken, async (req, res) => {
    try {
        const { configuracoes } = req.body;
        
        if (!configuracoes || typeof configuracoes !== 'object') {
            return res.status(400).json({
                error: 'Configurações inválidas',
                code: 'INVALID_SETTINGS'
            });
        }
        
        // Atualizar configurações
        await executeQuery(
            `UPDATE ${req.user.type === 'usuario' ? 'usuarios' : 'motoboys'} 
             SET configuracoes_notificacao = $1 
             WHERE id = $2`,
            [JSON.stringify(configuracoes), req.user.id]
        );
        
        // Log da atualização
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ${req.user.type === 'usuario' ? 'usuario_id' : 'motoboy_id'}) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'notificacoes',
                'settings_update',
                'Configurações de notificação atualizadas',
                JSON.stringify({ new_settings: configuracoes }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Configurações atualizadas com sucesso',
            configuracoes: configuracoes
        });
        
    } catch (error) {
        console.error('Erro ao atualizar configurações de notificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LIMPAR NOTIFICAÇÕES EXPIRADAS =====
router.delete('/expiradas/limpar', authenticateToken, async (req, res) => {
    try {
        const whereClause = req.user.type === 'usuario' 
            ? 'usuario_id = $1' 
            : 'motoboy_id = $1';
            
        const deleteResult = await executeQuery(
            `DELETE FROM notificacoes 
             WHERE ${whereClause} 
             AND data_expiracao IS NOT NULL 
             AND data_expiracao <= CURRENT_TIMESTAMP`,
            [req.user.id]
        );
        
        res.json({
            message: 'Notificações expiradas foram removidas',
            notificacoes_removidas: deleteResult.rowCount
        });
        
    } catch (error) {
        console.error('Erro ao limpar notificações expiradas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;