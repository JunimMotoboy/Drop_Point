const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ===== ENVIAR MENSAGEM =====
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            pedido_id,
            destinatario_tipo,
            destinatario_id,
            conteudo,
            tipo_mensagem = 'texto'
        } = req.body;
        
        // Validações básicas
        if (!conteudo || conteudo.trim().length === 0) {
            return res.status(400).json({
                error: 'Conteúdo da mensagem é obrigatório',
                code: 'MISSING_CONTENT'
            });
        }
        
        if (conteudo.length > 1000) {
            return res.status(400).json({
                error: 'Mensagem muito longa (máximo 1000 caracteres)',
                code: 'MESSAGE_TOO_LONG'
            });
        }
        
        // Validar tipo de mensagem
        const tiposValidos = ['texto', 'imagem', 'localizacao', 'arquivo', 'audio'];
        if (!tiposValidos.includes(tipo_mensagem)) {
            return res.status(400).json({
                error: 'Tipo de mensagem inválido',
                code: 'INVALID_MESSAGE_TYPE',
                valid_types: tiposValidos
            });
        }
        
        // Se for relacionado a um pedido, verificar acesso
        if (pedido_id) {
            const pedidoResult = await executeQuery(
                `SELECT usuario_id, motoboy_id FROM pedidos WHERE id = $1`,
                [pedido_id]
            );
            
            if (pedidoResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Pedido não encontrado',
                    code: 'ORDER_NOT_FOUND'
                });
            }
            
            const pedido = pedidoResult.rows[0];
            
            // Verificar se o usuário tem acesso ao pedido
            const temAcesso = (req.user.type === 'usuario' && req.user.id === pedido.usuario_id) ||
                            (req.user.type === 'motoboy' && req.user.id === pedido.motoboy_id);
            
            if (!temAcesso) {
                return res.status(403).json({
                    error: 'Sem acesso a este pedido',
                    code: 'NO_ACCESS_TO_ORDER'
                });
            }
            
            // Se não especificou destinatário, inferir baseado no remetente
            if (!destinatario_tipo || !destinatario_id) {
                if (req.user.type === 'usuario') {
                    destinatario_tipo = 'motoboy';
                    destinatario_id = pedido.motoboy_id;
                } else if (req.user.type === 'motoboy') {
                    destinatario_tipo = 'usuario';
                    destinatario_id = pedido.usuario_id;
                }
            }
        }
        
        // Inserir mensagem
        const mensagemResult = await executeQuery(
            `INSERT INTO mensagens (
                pedido_id, remetente_tipo, remetente_id, 
                destinatario_tipo, destinatario_id,
                conteudo, tipo_mensagem, ip_origem
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, timestamp_envio`,
            [
                pedido_id, req.user.type, req.user.id,
                destinatario_tipo, destinatario_id,
                conteudo.trim(), tipo_mensagem, req.ip
            ]
        );
        
        const novaMensagem = mensagemResult.rows[0];
        
        // Log da mensagem
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, ${req.user.type === 'usuario' ? 'usuario_id' : 'motoboy_id'}) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'mensagens',
                'send',
                'Nova mensagem enviada',
                JSON.stringify({
                    mensagem_id: novaMensagem.id,
                    pedido_id: pedido_id,
                    tipo_mensagem: tipo_mensagem,
                    destinatario_tipo: destinatario_tipo
                }),
                req.user.id
            ]
        );
        
        res.status(201).json({
            message: 'Mensagem enviada com sucesso',
            mensagem: {
                id: novaMensagem.id,
                timestamp_envio: novaMensagem.timestamp_envio
            }
        });
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR MENSAGENS DE UM PEDIDO =====
router.get('/pedido/:pedidoId', authenticateToken, async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        // Verificar acesso ao pedido
        const pedidoResult = await executeQuery(
            'SELECT usuario_id, motoboy_id FROM pedidos WHERE id = $1',
            [pedidoId]
        );
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = pedidoResult.rows[0];
        
        const temAcesso = (req.user.type === 'usuario' && req.user.id === pedido.usuario_id) ||
                        (req.user.type === 'motoboy' && req.user.id === pedido.motoboy_id);
        
        if (!temAcesso) {
            return res.status(403).json({
                error: 'Sem acesso a este pedido',
                code: 'NO_ACCESS_TO_ORDER'
            });
        }
        
        // Buscar mensagens
        const result = await executeQuery(
            `SELECT 
                m.id, m.remetente_tipo, m.remetente_id, m.destinatario_tipo, m.destinatario_id,
                m.conteudo, m.tipo_mensagem, m.timestamp_envio, m.lida, m.timestamp_leitura,
                m.editada, m.timestamp_edicao,
                CASE 
                    WHEN m.remetente_tipo = 'usuario' THEN u.nome
                    WHEN m.remetente_tipo = 'motoboy' THEN mb.nome
                    ELSE 'Sistema'
                END as remetente_nome
             FROM mensagens m
             LEFT JOIN usuarios u ON m.remetente_tipo = 'usuario' AND m.remetente_id = u.id
             LEFT JOIN motoboys mb ON m.remetente_tipo = 'motoboy' AND m.remetente_id = mb.id
             WHERE m.pedido_id = $1
             ORDER BY m.timestamp_envio ASC
             LIMIT $2 OFFSET $3`,
            [pedidoId, parseInt(limit), parseInt(offset)]
        );
        
        // Marcar mensagens como lidas se for o destinatário
        const mensagensParaMarcar = result.rows
            .filter(msg => 
                !msg.lida && 
                msg.destinatario_tipo === req.user.type && 
                msg.destinatario_id === req.user.id
            )
            .map(msg => msg.id);
        
        if (mensagensParaMarcar.length > 0) {
            await executeQuery(
                `UPDATE mensagens 
                 SET lida = true, timestamp_leitura = CURRENT_TIMESTAMP
                 WHERE id = ANY($1)`,
                [mensagensParaMarcar]
            );
        }
        
        res.json({
            mensagens: result.rows.map(msg => ({
                ...msg,
                lida: mensagensParaMarcar.includes(msg.id) ? true : msg.lida
            })),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar mensagens do pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR CONVERSAS DO USUÁRIO =====
router.get('/conversas', authenticateToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        // Buscar conversas (agrupadas por pedido)
        const result = await executeQuery(
            `SELECT DISTINCT ON (m.pedido_id)
                m.pedido_id,
                p.codigo_pedido,
                p.tipo_objeto,
                p.status as pedido_status,
                m.conteudo as ultima_mensagem,
                m.timestamp_envio as timestamp_ultima_mensagem,
                m.remetente_tipo as ultimo_remetente_tipo,
                COUNT(*) FILTER (WHERE m.lida = false AND m.destinatario_tipo = $1 AND m.destinatario_id = $2) OVER (PARTITION BY m.pedido_id) as mensagens_nao_lidas,
                CASE 
                    WHEN $1 = 'usuario' THEN mb.nome
                    WHEN $1 = 'motoboy' THEN u.nome
                END as conversa_com_nome
             FROM mensagens m
             JOIN pedidos p ON m.pedido_id = p.id
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN motoboys mb ON p.motoboy_id = mb.id
             WHERE (
                ($1 = 'usuario' AND p.usuario_id = $2) OR
                ($1 = 'motoboy' AND p.motoboy_id = $2)
             )
             ORDER BY m.pedido_id, m.timestamp_envio DESC
             LIMIT $3 OFFSET $4`,
            [req.user.type, req.user.id, parseInt(limit), parseInt(offset)]
        );
        
        res.json({
            conversas: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== MARCAR MENSAGEM COMO LIDA =====
router.patch('/:id/marcar-lida', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se a mensagem existe e é destinada ao usuário
        const mensagemResult = await executeQuery(
            `SELECT id, lida, destinatario_tipo, destinatario_id
             FROM mensagens 
             WHERE id = $1`,
            [id]
        );
        
        if (mensagemResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Mensagem não encontrada',
                code: 'MESSAGE_NOT_FOUND'
            });
        }
        
        const mensagem = mensagemResult.rows[0];
        
        // Verificar se é o destinatário
        if (mensagem.destinatario_tipo !== req.user.type || mensagem.destinatario_id !== req.user.id) {
            return res.status(403).json({
                error: 'Sem permissão para marcar esta mensagem',
                code: 'NO_PERMISSION'
            });
        }
        
        if (mensagem.lida) {
            return res.status(400).json({
                error: 'Mensagem já foi lida',
                code: 'ALREADY_READ'
            });
        }
        
        // Marcar como lida
        await executeQuery(
            `UPDATE mensagens 
             SET lida = true, timestamp_leitura = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );
        
        res.json({
            message: 'Mensagem marcada como lida',
            mensagem_id: id
        });
        
    } catch (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== MARCAR TODAS AS MENSAGENS DE UM PEDIDO COMO LIDAS =====
router.patch('/pedido/:pedidoId/marcar-todas-lidas', authenticateToken, async (req, res) => {
    try {
        const { pedidoId } = req.params;
        
        // Verificar acesso ao pedido
        const pedidoResult = await executeQuery(
            'SELECT usuario_id, motoboy_id FROM pedidos WHERE id = $1',
            [pedidoId]
        );
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = pedidoResult.rows[0];
        
        const temAcesso = (req.user.type === 'usuario' && req.user.id === pedido.usuario_id) ||
                        (req.user.type === 'motoboy' && req.user.id === pedido.motoboy_id);
        
        if (!temAcesso) {
            return res.status(403).json({
                error: 'Sem acesso a este pedido',
                code: 'NO_ACCESS_TO_ORDER'
            });
        }
        
        // Marcar todas as mensagens não lidas como lidas
        const updateResult = await executeQuery(
            `UPDATE mensagens 
             SET lida = true, timestamp_leitura = CURRENT_TIMESTAMP
             WHERE pedido_id = $1 
             AND destinatario_tipo = $2 
             AND destinatario_id = $3 
             AND lida = false`,
            [pedidoId, req.user.type, req.user.id]
        );
        
        res.json({
            message: 'Todas as mensagens foram marcadas como lidas',
            mensagens_atualizadas: updateResult.rowCount
        });
        
    } catch (error) {
        console.error('Erro ao marcar todas as mensagens como lidas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== OBTER CONTADORES DE MENSAGENS NÃO LIDAS =====
router.get('/nao-lidas/contador', authenticateToken, async (req, res) => {
    try {
        // Contar mensagens não lidas por pedido
        const result = await executeQuery(
            `SELECT 
                m.pedido_id,
                p.codigo_pedido,
                COUNT(*) as mensagens_nao_lidas
             FROM mensagens m
             JOIN pedidos p ON m.pedido_id = p.id
             WHERE m.destinatario_tipo = $1 
             AND m.destinatario_id = $2 
             AND m.lida = false
             GROUP BY m.pedido_id, p.codigo_pedido`,
            [req.user.type, req.user.id]
        );
        
        // Total geral
        const totalResult = await executeQuery(
            `SELECT COUNT(*) as total
             FROM mensagens
             WHERE destinatario_tipo = $1 
             AND destinatario_id = $2 
             AND lida = false`,
            [req.user.type, req.user.id]
        );
        
        const total = parseInt(totalResult.rows[0].total);
        
        res.json({
            total_nao_lidas: total,
            por_pedido: result.rows.map(row => ({
                pedido_id: row.pedido_id,
                codigo_pedido: row.codigo_pedido,
                mensagens_nao_lidas: parseInt(row.mensagens_nao_lidas)
            }))
        });
        
    } catch (error) {
        console.error('Erro ao buscar contador de mensagens não lidas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== BUSCAR MENSAGENS =====
router.get('/buscar', authenticateToken, async (req, res) => {
    try {
        const { q, pedido_id, limit = 20, offset = 0 } = req.query;
        
        if (!q || q.trim().length < 3) {
            return res.status(400).json({
                error: 'Termo de busca deve ter pelo menos 3 caracteres',
                code: 'SEARCH_TERM_TOO_SHORT'
            });
        }
        
        // Construir query de busca
        let whereClause = `WHERE (
            (m.remetente_tipo = $1 AND m.remetente_id = $2) OR
            (m.destinatario_tipo = $1 AND m.destinatario_id = $2)
        ) AND LOWER(m.conteudo) LIKE LOWER($3)`;
        
        const values = [req.user.type, req.user.id, `%${q.trim()}%`];
        let paramCount = 4;
        
        if (pedido_id) {
            whereClause += ` AND m.pedido_id = $${paramCount++}`;
            values.push(pedido_id);
        }
        
        const result = await executeQuery(
            `SELECT 
                m.id, m.pedido_id, m.conteudo, m.tipo_mensagem,
                m.timestamp_envio, m.remetente_tipo, m.remetente_id,
                p.codigo_pedido,
                CASE 
                    WHEN m.remetente_tipo = 'usuario' THEN u.nome
                    WHEN m.remetente_tipo = 'motoboy' THEN mb.nome
                    ELSE 'Sistema'
                END as remetente_nome
             FROM mensagens m
             JOIN pedidos p ON m.pedido_id = p.id
             LEFT JOIN usuarios u ON m.remetente_tipo = 'usuario' AND m.remetente_id = u.id
             LEFT JOIN motoboys mb ON m.remetente_tipo = 'motoboy' AND m.remetente_id = mb.id
             ${whereClause}
             ORDER BY m.timestamp_envio DESC
             LIMIT $${paramCount++} OFFSET $${paramCount}`,
            [...values, parseInt(limit), parseInt(offset)]
        );
        
        res.json({
            mensagens: result.rows,
            termo_busca: q,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;