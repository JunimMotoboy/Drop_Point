const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireUser } = require('../middleware/auth');

const router = express.Router();

// ===== OBTER PERFIL DO USUÁRIO =====
router.get('/profile', authenticateToken, requireUser, async (req, res) => {
    try {
        const userResult = await executeQuery(
            `SELECT 
                id, nome, email, telefone, avatar_url, endereco_principal,
                status, verificado, email_verificado, telefone_verificado,
                data_cadastro, ultima_atividade, preferencias
             FROM usuarios 
             WHERE id = $1`,
            [req.user.id]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = userResult.rows[0];
        
        // Buscar estatísticas do usuário
        const statsResult = await executeQuery(
            `SELECT 
                COUNT(*) as total_pedidos,
                COUNT(*) FILTER (WHERE status = 'entregue') as pedidos_entregues,
                COUNT(*) FILTER (WHERE status = 'cancelado') as pedidos_cancelados,
                COUNT(*) FILTER (WHERE status IN ('pendente', 'aceito', 'coletado', 'em_transito')) as pedidos_ativos,
                AVG(valor_entrega) FILTER (WHERE status = 'entregue') as valor_medio_pedidos
             FROM pedidos 
             WHERE usuario_id = $1`,
            [req.user.id]
        );
        
        const stats = statsResult.rows[0];
        
        res.json({
            user: {
                ...user,
                stats: {
                    total_pedidos: parseInt(stats.total_pedidos) || 0,
                    pedidos_entregues: parseInt(stats.pedidos_entregues) || 0,
                    pedidos_cancelados: parseInt(stats.pedidos_cancelados) || 0,
                    pedidos_ativos: parseInt(stats.pedidos_ativos) || 0,
                    valor_medio_pedidos: parseFloat(stats.valor_medio_pedidos) || 0
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ATUALIZAR PERFIL DO USUÁRIO =====
router.put('/profile', authenticateToken, requireUser, async (req, res) => {
    try {
        const { nome, telefone, endereco_principal, preferencias } = req.body;
        
        // Validações
        if (nome && nome.trim().length < 2) {
            return res.status(400).json({
                error: 'Nome deve ter pelo menos 2 caracteres',
                code: 'INVALID_NAME'
            });
        }
        
        // Construir query de update dinamicamente
        const updateFields = [];
        const values = [];
        let paramCount = 1;
        
        if (nome !== undefined) {
            updateFields.push(`nome = $${paramCount++}`);
            values.push(nome.trim());
        }
        
        if (telefone !== undefined) {
            updateFields.push(`telefone = $${paramCount++}`);
            values.push(telefone);
        }
        
        if (endereco_principal !== undefined) {
            updateFields.push(`endereco_principal = $${paramCount++}`);
            values.push(endereco_principal);
        }
        
        if (preferencias !== undefined) {
            updateFields.push(`preferencias = $${paramCount++}`);
            values.push(JSON.stringify(preferencias));
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'Nenhum campo para atualizar',
                code: 'NO_FIELDS_TO_UPDATE'
            });
        }
        
        // Adicionar ID do usuário e timestamp
        values.push(req.user.id);
        updateFields.push(`ultima_atividade = CURRENT_TIMESTAMP`);
        
        const updateQuery = `
            UPDATE usuarios 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, nome, email, telefone, endereco_principal, preferencias
        `;
        
        const result = await executeQuery(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Log da atualização
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'usuarios',
                'profile_update',
                'Perfil de usuário atualizado',
                JSON.stringify({ updated_fields: Object.keys(req.body) }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Perfil atualizado com sucesso',
            user: result.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar perfil do usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR PEDIDOS DO USUÁRIO =====
router.get('/pedidos', authenticateToken, requireUser, async (req, res) => {
    try {
        const { status, limit = 20, offset = 0, sort = 'data_criacao', order = 'DESC' } = req.query;
        
        // Validar parâmetros
        const validSorts = ['data_criacao', 'valor_entrega', 'status'];
        const validOrders = ['ASC', 'DESC'];
        
        if (!validSorts.includes(sort)) {
            return res.status(400).json({
                error: 'Campo de ordenação inválido',
                code: 'INVALID_SORT'
            });
        }
        
        if (!validOrders.includes(order.toUpperCase())) {
            return res.status(400).json({
                error: 'Ordem de classificação inválida',
                code: 'INVALID_ORDER'
            });
        }
        
        // Construir query com filtros
        let whereClause = 'WHERE p.usuario_id = $1';
        const values = [req.user.id];
        let paramCount = 2;
        
        if (status) {
            whereClause += ` AND p.status = $${paramCount++}`;
            values.push(status);
        }
        
        const query = `
            SELECT 
                p.id, p.codigo_pedido, p.tipo_objeto, p.empresa_origem,
                p.endereco_coleta, p.endereco_entrega, p.valor_entrega,
                p.distancia_km, p.urgencia, p.status, p.observacoes,
                p.data_criacao, p.data_coleta, p.data_entrega,
                m.nome as motoboy_nome, m.telefone as motoboy_telefone,
                m.placa_moto, m.modelo_moto,
                av.nota_geral as avaliacao_nota
            FROM pedidos p
            LEFT JOIN motoboys m ON p.motoboy_id = m.id
            LEFT JOIN avaliacoes av ON p.id = av.pedido_id
            ${whereClause}
            ORDER BY p.${sort} ${order.toUpperCase()}
            LIMIT $${paramCount++} OFFSET $${paramCount}
        `;
        
        values.push(parseInt(limit), parseInt(offset));
        
        const result = await executeQuery(query, values);
        
        // Contar total de pedidos
        const countQuery = `
            SELECT COUNT(*) as total
            FROM pedidos p
            ${whereClause}
        `;
        
        const countResult = await executeQuery(countQuery, values.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            pedidos: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar pedidos do usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== OBTER PEDIDO ESPECÍFICO =====
router.get('/pedidos/:id', authenticateToken, requireUser, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await executeQuery(
            `SELECT 
                p.*,
                m.nome as motoboy_nome, m.telefone as motoboy_telefone,
                m.placa_moto, m.modelo_moto, m.avaliacao_media as motoboy_avaliacao,
                av.nota_geral as minha_avaliacao, av.comentario as meu_comentario
             FROM pedidos p
             LEFT JOIN motoboys m ON p.motoboy_id = m.id
             LEFT JOIN avaliacoes av ON p.id = av.pedido_id AND av.usuario_id = $2
             WHERE p.id = $1 AND p.usuario_id = $2`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = result.rows[0];
        
        // Buscar histórico do pedido
        const historicoResult = await executeQuery(
            `SELECT status_anterior, status_novo, timestamp_mudanca, observacoes
             FROM pedido_historico
             WHERE pedido_id = $1
             ORDER BY timestamp_mudanca ASC`,
            [id]
        );
        
        pedido.historico = historicoResult.rows;
        
        res.json({ pedido });
        
    } catch (error) {
        console.error('Erro ao buscar pedido específico:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== CANCELAR PEDIDO =====
router.patch('/pedidos/:id/cancelar', authenticateToken, requireUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        if (!motivo || motivo.trim().length < 10) {
            return res.status(400).json({
                error: 'Motivo do cancelamento deve ter pelo menos 10 caracteres',
                code: 'INVALID_CANCEL_REASON'
            });
        }
        
        // Verificar se o pedido pode ser cancelado
        const pedidoResult = await executeQuery(
            'SELECT id, status, data_criacao FROM pedidos WHERE id = $1 AND usuario_id = $2',
            [id, req.user.id]
        );
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = pedidoResult.rows[0];
        
        // Verificar se pode cancelar baseado no status
        const cancelableStatuses = ['pendente', 'aceito'];
        if (!cancelableStatuses.includes(pedido.status)) {
            return res.status(400).json({
                error: 'Pedido não pode ser cancelado neste status',
                code: 'CANNOT_CANCEL_STATUS',
                current_status: pedido.status
            });
        }
        
        // Atualizar pedido
        await executeQuery(
            `UPDATE pedidos 
             SET status = 'cancelado', 
                 data_cancelamento = CURRENT_TIMESTAMP,
                 cancelado_por = 'usuario',
                 motivo_cancelamento = $2
             WHERE id = $1`,
            [id, motivo.trim()]
        );
        
        // Log do cancelamento
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'pedidos',
                'cancel',
                'Pedido cancelado pelo usuário',
                JSON.stringify({ 
                    pedido_id: id,
                    motivo: motivo.trim(),
                    status_anterior: pedido.status 
                }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Pedido cancelado com sucesso',
            pedido_id: id
        });
        
    } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== DASHBOARD/ESTATÍSTICAS =====
router.get('/dashboard', authenticateToken, requireUser, async (req, res) => {
    try {
        // Estatísticas gerais
        const statsResult = await executeQuery(
            `SELECT 
                COUNT(*) as total_pedidos,
                COUNT(*) FILTER (WHERE status = 'entregue') as pedidos_entregues,
                COUNT(*) FILTER (WHERE status = 'cancelado') as pedidos_cancelados,
                COUNT(*) FILTER (WHERE status IN ('pendente', 'aceito', 'coletado', 'em_transito')) as pedidos_ativos,
                COALESCE(SUM(valor_entrega) FILTER (WHERE status = 'entregue'), 0) as total_gasto,
                COALESCE(AVG(valor_entrega) FILTER (WHERE status = 'entregue'), 0) as valor_medio
             FROM pedidos 
             WHERE usuario_id = $1`,
            [req.user.id]
        );
        
        // Pedidos recentes (últimos 5)
        const recentOrdersResult = await executeQuery(
            `SELECT 
                p.id, p.codigo_pedido, p.tipo_objeto, p.status,
                p.valor_entrega, p.data_criacao,
                m.nome as motoboy_nome
             FROM pedidos p
             LEFT JOIN motoboys m ON p.motoboy_id = m.id
             WHERE p.usuario_id = $1
             ORDER BY p.data_criacao DESC
             LIMIT 5`,
            [req.user.id]
        );
        
        // Pedidos por status (para gráfico)
        const statusResult = await executeQuery(
            `SELECT status, COUNT(*) as count
             FROM pedidos 
             WHERE usuario_id = $1
             GROUP BY status
             ORDER BY count DESC`,
            [req.user.id]
        );
        
        // Gastos por mês (últimos 6 meses)
        const monthlySpendingResult = await executeQuery(
            `SELECT 
                TO_CHAR(data_criacao, 'YYYY-MM') as mes,
                COUNT(*) as pedidos,
                COALESCE(SUM(valor_entrega), 0) as total_gasto
             FROM pedidos 
             WHERE usuario_id = $1 
             AND data_criacao >= CURRENT_DATE - INTERVAL '6 months'
             AND status = 'entregue'
             GROUP BY TO_CHAR(data_criacao, 'YYYY-MM')
             ORDER BY mes DESC`,
            [req.user.id]
        );
        
        const stats = statsResult.rows[0];
        
        res.json({
            stats: {
                total_pedidos: parseInt(stats.total_pedidos) || 0,
                pedidos_entregues: parseInt(stats.pedidos_entregues) || 0,
                pedidos_cancelados: parseInt(stats.pedidos_cancelados) || 0,
                pedidos_ativos: parseInt(stats.pedidos_ativos) || 0,
                total_gasto: parseFloat(stats.total_gasto) || 0,
                valor_medio: parseFloat(stats.valor_medio) || 0
            },
            recent_orders: recentOrdersResult.rows,
            orders_by_status: statusResult.rows.map(row => ({
                status: row.status,
                count: parseInt(row.count)
            })),
            monthly_spending: monthlySpendingResult.rows.map(row => ({
                mes: row.mes,
                pedidos: parseInt(row.pedidos),
                total_gasto: parseFloat(row.total_gasto)
            }))
        });
        
    } catch (error) {
        console.error('Erro ao buscar dashboard do usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;