const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireMotoboy } = require('../middleware/auth');

const router = express.Router();

// ===== OBTER PERFIL DO MOTOBOY =====
router.get('/profile', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        const motoboyResult = await executeQuery(
            `SELECT 
                id, nome, email, telefone, cpf, cnh,
                placa_moto, modelo_moto, cor_moto, ano_moto,
                status, verificado, aprovado, disponivel, online,
                total_entregas, entregas_concluidas, entregas_canceladas,
                avaliacao_media, total_avaliacoes,
                data_cadastro, data_aprovacao, ultima_atividade
             FROM motoboys 
             WHERE id = $1`,
            [req.user.id]
        );
        
        if (motoboyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Motoboy não encontrado',
                code: 'MOTOBOY_NOT_FOUND'
            });
        }
        
        const motoboy = motoboyResult.rows[0];
        
        // Buscar estatísticas detalhadas
        const statsResult = await executeQuery(
            `SELECT 
                COUNT(*) FILTER (WHERE data_criacao >= CURRENT_DATE - INTERVAL '30 days') as pedidos_mes_atual,
                COUNT(*) FILTER (WHERE data_criacao >= CURRENT_DATE - INTERVAL '7 days') as pedidos_semana_atual,
                COUNT(*) FILTER (WHERE status IN ('aceito', 'coletado', 'em_transito')) as pedidos_ativos,
                AVG(EXTRACT(EPOCH FROM (data_entrega - data_coleta))/60) FILTER (WHERE data_entrega IS NOT NULL AND data_coleta IS NOT NULL) as tempo_medio_entrega,
                SUM(valor_entrega) FILTER (WHERE status = 'entregue' AND data_criacao >= CURRENT_DATE - INTERVAL '30 days') as ganhos_mes_atual
             FROM pedidos 
             WHERE motoboy_id = $1`,
            [req.user.id]
        );
        
        const stats = statsResult.rows[0];
        
        res.json({
            motoboy: {
                ...motoboy,
                stats: {
                    pedidos_mes_atual: parseInt(stats.pedidos_mes_atual) || 0,
                    pedidos_semana_atual: parseInt(stats.pedidos_semana_atual) || 0,
                    pedidos_ativos: parseInt(stats.pedidos_ativos) || 0,
                    tempo_medio_entrega: parseFloat(stats.tempo_medio_entrega) || 0,
                    ganhos_mes_atual: parseFloat(stats.ganhos_mes_atual) || 0
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar perfil do motoboy:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ATUALIZAR DISPONIBILIDADE =====
router.patch('/disponibilidade', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        const { disponivel } = req.body;
        
        if (typeof disponivel !== 'boolean') {
            return res.status(400).json({
                error: 'Campo disponivel deve ser true ou false',
                code: 'INVALID_AVAILABILITY'
            });
        }
        
        await executeQuery(
            'UPDATE motoboys SET disponivel = $1, ultima_atividade = CURRENT_TIMESTAMP WHERE id = $2',
            [disponivel, req.user.id]
        );
        
        // Log da mudança de disponibilidade
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, motoboy_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'motoboys',
                'availability',
                'Motoboy alterou disponibilidade',
                JSON.stringify({ disponivel }),
                req.user.id
            ]
        );
        
        res.json({
            message: `Motoboy marcado como ${disponivel ? 'disponível' : 'indisponível'}`,
            disponivel
        });
        
    } catch (error) {
        console.error('Erro ao atualizar disponibilidade:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ATUALIZAR LOCALIZAÇÃO =====
router.put('/localizacao', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        
        // Validações básicas
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Latitude e longitude são obrigatórias',
                code: 'MISSING_COORDINATES'
            });
        }
        
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: 'Coordenadas inválidas',
                code: 'INVALID_COORDINATES'
            });
        }
        
        await executeQuery(
            `UPDATE motoboys 
             SET latitude = $1, longitude = $2, ultima_localizacao = CURRENT_TIMESTAMP,
                 ultima_atividade = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [latitude, longitude, req.user.id]
        );
        
        res.json({
            message: 'Localização atualizada com sucesso',
            coordinates: { latitude, longitude }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR PEDIDOS DISPONÍVEIS =====
router.get('/pedidos-disponiveis', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        const { limit = 10, raio = 10 } = req.query;
        
        // Buscar localização atual do motoboy
        const motoboyResult = await executeQuery(
            'SELECT latitude, longitude, disponivel, aprovado FROM motoboys WHERE id = $1',
            [req.user.id]
        );
        
        if (motoboyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Motoboy não encontrado',
                code: 'MOTOBOY_NOT_FOUND'
            });
        }
        
        const motoboy = motoboyResult.rows[0];
        
        if (!motoboy.aprovado) {
            return res.status(403).json({
                error: 'Motoboy não aprovado',
                code: 'NOT_APPROVED'
            });
        }
        
        if (!motoboy.disponivel) {
            return res.json({
                pedidos: [],
                message: 'Motoboy indisponível'
            });
        }
        
        // Se não tem localização, retornar pedidos sem filtro de distância
        let query = `
            SELECT 
                p.id, p.codigo_pedido, p.tipo_objeto, p.empresa_origem,
                p.endereco_coleta, p.endereco_entrega, p.valor_entrega,
                p.distancia_km, p.urgencia, p.observacoes, p.data_criacao,
                p.latitude_coleta, p.longitude_coleta,
                p.latitude_entrega, p.longitude_entrega,
                u.nome as usuario_nome,
                CASE 
                    WHEN p.latitude_coleta IS NOT NULL AND p.longitude_coleta IS NOT NULL 
                         AND $2 IS NOT NULL AND $3 IS NOT NULL THEN
                        calcular_distancia($2, $3, p.latitude_coleta, p.longitude_coleta)
                    ELSE NULL 
                END as distancia_motoboy
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.status = 'pendente'
            ORDER BY 
                CASE WHEN p.urgencia = 'ultra' THEN 1
                     WHEN p.urgencia = 'expressa' THEN 2  
                     WHEN p.urgencia = 'normal' THEN 3
                     ELSE 4 END,
                p.data_criacao ASC
            LIMIT $1
        `;
        
        const values = [
            parseInt(limit),
            motoboy.latitude,
            motoboy.longitude
        ];
        
        const result = await executeQuery(query, values);
        
        res.json({
            pedidos: result.rows.map(pedido => ({
                ...pedido,
                distancia_motoboy: pedido.distancia_motoboy ? parseFloat(pedido.distancia_motoboy) : null
            }))
        });
        
    } catch (error) {
        console.error('Erro ao listar pedidos disponíveis:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ACEITAR PEDIDO =====
router.post('/pedidos/:id/aceitar', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se o motoboy está disponível e aprovado
        const motoboyResult = await executeQuery(
            'SELECT disponivel, aprovado, status FROM motoboys WHERE id = $1',
            [req.user.id]
        );
        
        if (motoboyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Motoboy não encontrado',
                code: 'MOTOBOY_NOT_FOUND'
            });
        }
        
        const motoboy = motoboyResult.rows[0];
        
        if (!motoboy.aprovado || motoboy.status !== 'ativo') {
            return res.status(403).json({
                error: 'Motoboy não autorizado a aceitar pedidos',
                code: 'NOT_AUTHORIZED'
            });
        }
        
        if (!motoboy.disponivel) {
            return res.status(400).json({
                error: 'Motoboy indisponível',
                code: 'MOTOBOY_UNAVAILABLE'
            });
        }
        
        // Verificar se o pedido existe e está disponível
        const pedidoResult = await executeQuery(
            'SELECT id, status, usuario_id FROM pedidos WHERE id = $1',
            [id]
        );
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = pedidoResult.rows[0];
        
        if (pedido.status !== 'pendente') {
            return res.status(400).json({
                error: 'Pedido não está mais disponível',
                code: 'ORDER_NOT_AVAILABLE',
                current_status: pedido.status
            });
        }
        
        // Verificar se o motoboy não tem pedidos ativos demais
        const activePedidosResult = await executeQuery(
            `SELECT COUNT(*) as count 
             FROM pedidos 
             WHERE motoboy_id = $1 AND status IN ('aceito', 'coletado', 'em_transito')`,
            [req.user.id]
        );
        
        const activePedidos = parseInt(activePedidosResult.rows[0].count);
        const maxActivePedidos = 3; // Máximo de pedidos ativos por motoboy
        
        if (activePedidos >= maxActivePedidos) {
            return res.status(400).json({
                error: 'Limite de pedidos ativos atingido',
                code: 'TOO_MANY_ACTIVE_ORDERS',
                max_allowed: maxActivePedidos
            });
        }
        
        // Aceitar o pedido
        await executeQuery(
            `UPDATE pedidos 
             SET motoboy_id = $1, status = 'aceito', data_aceito = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [req.user.id, id]
        );
        
        // Log da aceitação
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, motoboy_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'pedidos',
                'accept',
                'Pedido aceito por motoboy',
                JSON.stringify({ 
                    pedido_id: id,
                    usuario_id: pedido.usuario_id 
                }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Pedido aceito com sucesso',
            pedido_id: id
        });
        
    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR PEDIDOS DO MOTOBOY =====
router.get('/pedidos', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;
        
        // Construir query com filtros
        let whereClause = 'WHERE p.motoboy_id = $1';
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
                p.data_criacao, p.data_aceito, p.data_coleta, p.data_entrega,
                p.codigo_coleta, p.codigo_entrega,
                u.nome as usuario_nome, u.telefone as usuario_telefone,
                av.nota_geral as avaliacao_recebida
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN avaliacoes av ON p.id = av.pedido_id
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN p.status IN ('aceito', 'coletado', 'em_transito') THEN 1
                    ELSE 2 
                END,
                p.data_criacao DESC
            LIMIT $${paramCount++} OFFSET $${paramCount}
        `;
        
        values.push(parseInt(limit), parseInt(offset));
        
        const result = await executeQuery(query, values);
        
        // Contar total
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
        console.error('Erro ao listar pedidos do motoboy:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== DASHBOARD/ESTATÍSTICAS =====
router.get('/dashboard', authenticateToken, requireMotoboy, async (req, res) => {
    try {
        // Estatísticas gerais
        const statsResult = await executeQuery(
            `SELECT 
                COUNT(*) as total_pedidos,
                COUNT(*) FILTER (WHERE status = 'entregue') as pedidos_entregues,
                COUNT(*) FILTER (WHERE status = 'cancelado') as pedidos_cancelados,
                COUNT(*) FILTER (WHERE status IN ('aceito', 'coletado', 'em_transito')) as pedidos_ativos,
                COUNT(*) FILTER (WHERE data_criacao >= CURRENT_DATE - INTERVAL '30 days') as pedidos_mes_atual,
                COUNT(*) FILTER (WHERE data_criacao >= CURRENT_DATE - INTERVAL '7 days') as pedidos_semana_atual,
                COALESCE(SUM(valor_entrega) FILTER (WHERE status = 'entregue'), 0) as ganhos_total,
                COALESCE(SUM(valor_entrega) FILTER (WHERE status = 'entregue' AND data_criacao >= CURRENT_DATE - INTERVAL '30 days'), 0) as ganhos_mes_atual,
                COALESCE(AVG(valor_entrega) FILTER (WHERE status = 'entregue'), 0) as valor_medio_entrega
             FROM pedidos 
             WHERE motoboy_id = $1`,
            [req.user.id]
        );
        
        // Avaliações
        const avaliacoesResult = await executeQuery(
            `SELECT 
                AVG(nota_geral) as media_geral,
                AVG(nota_pontualidade) as media_pontualidade,
                AVG(nota_cuidado) as media_cuidado,
                AVG(nota_atendimento) as media_atendimento,
                COUNT(*) as total_avaliacoes
             FROM avaliacoes 
             WHERE motoboy_id = $1`,
            [req.user.id]
        );
        
        // Pedidos recentes
        const recentOrdersResult = await executeQuery(
            `SELECT 
                p.id, p.codigo_pedido, p.tipo_objeto, p.status,
                p.valor_entrega, p.data_criacao,
                u.nome as usuario_nome
             FROM pedidos p
             JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.motoboy_id = $1
             ORDER BY p.data_criacao DESC
             LIMIT 5`,
            [req.user.id]
        );
        
        // Ganhos por mês (últimos 6 meses)
        const monthlyEarningsResult = await executeQuery(
            `SELECT 
                TO_CHAR(data_criacao, 'YYYY-MM') as mes,
                COUNT(*) as pedidos,
                COALESCE(SUM(valor_entrega), 0) as ganhos
             FROM pedidos 
             WHERE motoboy_id = $1 
             AND data_criacao >= CURRENT_DATE - INTERVAL '6 months'
             AND status = 'entregue'
             GROUP BY TO_CHAR(data_criacao, 'YYYY-MM')
             ORDER BY mes DESC`,
            [req.user.id]
        );
        
        const stats = statsResult.rows[0];
        const avaliacoes = avaliacoesResult.rows[0];
        
        res.json({
            stats: {
                total_pedidos: parseInt(stats.total_pedidos) || 0,
                pedidos_entregues: parseInt(stats.pedidos_entregues) || 0,
                pedidos_cancelados: parseInt(stats.pedidos_cancelados) || 0,
                pedidos_ativos: parseInt(stats.pedidos_ativos) || 0,
                pedidos_mes_atual: parseInt(stats.pedidos_mes_atual) || 0,
                pedidos_semana_atual: parseInt(stats.pedidos_semana_atual) || 0,
                ganhos_total: parseFloat(stats.ganhos_total) || 0,
                ganhos_mes_atual: parseFloat(stats.ganhos_mes_atual) || 0,
                valor_medio_entrega: parseFloat(stats.valor_medio_entrega) || 0
            },
            avaliacoes: {
                media_geral: parseFloat(avaliacoes.media_geral) || 0,
                media_pontualidade: parseFloat(avaliacoes.media_pontualidade) || 0,
                media_cuidado: parseFloat(avaliacoes.media_cuidado) || 0,
                media_atendimento: parseFloat(avaliacoes.media_atendimento) || 0,
                total_avaliacoes: parseInt(avaliacoes.total_avaliacoes) || 0
            },
            recent_orders: recentOrdersResult.rows,
            monthly_earnings: monthlyEarningsResult.rows.map(row => ({
                mes: row.mes,
                pedidos: parseInt(row.pedidos),
                ganhos: parseFloat(row.ganhos)
            }))
        });
        
    } catch (error) {
        console.error('Erro ao buscar dashboard do motoboy:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;