const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireUser } = require('../middleware/auth');

const router = express.Router();

// ===== CRIAR AVALIAÇÃO =====
router.post('/', authenticateToken, requireUser, async (req, res) => {
    try {
        const {
            pedido_id,
            nota_geral,
            nota_pontualidade,
            nota_cuidado,
            nota_atendimento,
            comentario,
            pontos_positivos,
            pontos_negativos,
            anonima = false
        } = req.body;
        
        // Validações obrigatórias
        if (!pedido_id || !nota_geral) {
            return res.status(400).json({
                error: 'Pedido ID e nota geral são obrigatórios',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        // Validar notas (1-5)
        const notas = [nota_geral, nota_pontualidade, nota_cuidado, nota_atendimento].filter(Boolean);
        const notasInvalidas = notas.filter(nota => nota < 1 || nota > 5);
        
        if (notasInvalidas.length > 0) {
            return res.status(400).json({
                error: 'Notas devem estar entre 1 e 5',
                code: 'INVALID_RATING'
            });
        }
        
        // Verificar se o pedido existe e pertence ao usuário
        const pedidoResult = await executeQuery(
            `SELECT id, status, motoboy_id, usuario_id, avaliado
             FROM pedidos 
             WHERE id = $1 AND usuario_id = $2`,
            [pedido_id, req.user.id]
        );
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado ou não pertence ao usuário',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = pedidoResult.rows[0];
        
        // Verificar se o pedido foi entregue
        if (pedido.status !== 'entregue') {
            return res.status(400).json({
                error: 'Só é possível avaliar pedidos entregues',
                code: 'ORDER_NOT_DELIVERED'
            });
        }
        
        // Verificar se já foi avaliado
        if (pedido.avaliado) {
            return res.status(400).json({
                error: 'Pedido já foi avaliado',
                code: 'ALREADY_RATED'
            });
        }
        
        // Verificar se tem motoboy
        if (!pedido.motoboy_id) {
            return res.status(400).json({
                error: 'Pedido não tem motoboy atribuído',
                code: 'NO_MOTOBOY_ASSIGNED'
            });
        }
        
        // Verificar se já existe avaliação (dupla verificação)
        const avaliacaoExistente = await executeQuery(
            'SELECT id FROM avaliacoes WHERE pedido_id = $1 AND usuario_id = $2',
            [pedido_id, req.user.id]
        );
        
        if (avaliacaoExistente.rows.length > 0) {
            return res.status(409).json({
                error: 'Avaliação já existe para este pedido',
                code: 'EVALUATION_EXISTS'
            });
        }
        
        // Criar avaliação
        const avaliacaoResult = await executeQuery(
            `INSERT INTO avaliacoes (
                pedido_id, usuario_id, motoboy_id,
                nota_geral, nota_pontualidade, nota_cuidado, nota_atendimento,
                comentario, pontos_positivos, pontos_negativos, anonima
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, data_avaliacao`,
            [
                pedido_id, req.user.id, pedido.motoboy_id,
                nota_geral, nota_pontualidade, nota_cuidado, nota_atendimento,
                comentario, pontos_positivos, pontos_negativos, anonima
            ]
        );
        
        // Marcar pedido como avaliado
        await executeQuery(
            'UPDATE pedidos SET avaliado = true WHERE id = $1',
            [pedido_id]
        );
        
        // Log da avaliação
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'avaliacoes',
                'create',
                'Nova avaliação criada',
                JSON.stringify({
                    pedido_id: pedido_id,
                    motoboy_id: pedido.motoboy_id,
                    nota_geral: nota_geral,
                    anonima: anonima
                }),
                req.user.id
            ]
        );
        
        res.status(201).json({
            message: 'Avaliação criada com sucesso',
            avaliacao: {
                id: avaliacaoResult.rows[0].id,
                data_avaliacao: avaliacaoResult.rows[0].data_avaliacao,
                nota_geral: nota_geral
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar avaliação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR AVALIAÇÕES DO USUÁRIO =====
router.get('/minhas', authenticateToken, requireUser, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        const result = await executeQuery(
            `SELECT 
                av.id, av.nota_geral, av.nota_pontualidade, av.nota_cuidado, av.nota_atendimento,
                av.comentario, av.pontos_positivos, av.pontos_negativos, av.data_avaliacao,
                p.codigo_pedido, p.tipo_objeto, p.valor_entrega,
                m.nome as motoboy_nome, m.placa_moto, m.modelo_moto
             FROM avaliacoes av
             JOIN pedidos p ON av.pedido_id = p.id
             JOIN motoboys m ON av.motoboy_id = m.id
             WHERE av.usuario_id = $1
             ORDER BY av.data_avaliacao DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, parseInt(limit), parseInt(offset)]
        );
        
        // Contar total
        const countResult = await executeQuery(
            'SELECT COUNT(*) as total FROM avaliacoes WHERE usuario_id = $1',
            [req.user.id]
        );
        
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            avaliacoes: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar avaliações do usuário:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== OBTER AVALIAÇÕES DE UM MOTOBOY =====
router.get('/motoboy/:motoboyId', async (req, res) => {
    try {
        const { motoboyId } = req.params;
        const { limit = 10, offset = 0, incluir_anonimas = true } = req.query;
        
        // Filtro para avaliações anônimas
        let whereClause = 'WHERE av.motoboy_id = $1 AND av.aprovada = true';
        if (incluir_anonimas === 'false') {
            whereClause += ' AND av.anonima = false';
        }
        
        const result = await executeQuery(
            `SELECT 
                av.id, av.nota_geral, av.nota_pontualidade, av.nota_cuidado, av.nota_atendimento,
                av.comentario, av.pontos_positivos, av.pontos_negativos, 
                av.data_avaliacao, av.anonima,
                CASE WHEN av.anonima THEN 'Usuário Anônimo' ELSE u.nome END as usuario_nome,
                p.codigo_pedido, p.tipo_objeto
             FROM avaliacoes av
             JOIN pedidos p ON av.pedido_id = p.id
             JOIN usuarios u ON av.usuario_id = u.id
             ${whereClause}
             ORDER BY av.data_avaliacao DESC
             LIMIT $2 OFFSET $3`,
            [motoboyId, parseInt(limit), parseInt(offset)]
        );
        
        // Estatísticas do motoboy
        const statsResult = await executeQuery(
            `SELECT 
                COUNT(*) as total_avaliacoes,
                AVG(nota_geral) as media_geral,
                AVG(nota_pontualidade) as media_pontualidade,
                AVG(nota_cuidado) as media_cuidado,
                AVG(nota_atendimento) as media_atendimento,
                COUNT(*) FILTER (WHERE nota_geral = 5) as avaliacoes_5_estrelas,
                COUNT(*) FILTER (WHERE nota_geral = 4) as avaliacoes_4_estrelas,
                COUNT(*) FILTER (WHERE nota_geral = 3) as avaliacoes_3_estrelas,
                COUNT(*) FILTER (WHERE nota_geral = 2) as avaliacoes_2_estrelas,
                COUNT(*) FILTER (WHERE nota_geral = 1) as avaliacoes_1_estrela
             FROM avaliacoes 
             WHERE motoboy_id = $1 AND aprovada = true`,
            [motoboyId]
        );
        
        const stats = statsResult.rows[0];
        
        res.json({
            avaliacoes: result.rows,
            estatisticas: {
                total_avaliacoes: parseInt(stats.total_avaliacoes) || 0,
                media_geral: parseFloat(stats.media_geral) || 0,
                media_pontualidade: parseFloat(stats.media_pontualidade) || 0,
                media_cuidado: parseFloat(stats.media_cuidado) || 0,
                media_atendimento: parseFloat(stats.media_atendimento) || 0,
                distribuicao_notas: {
                    5: parseInt(stats.avaliacoes_5_estrelas) || 0,
                    4: parseInt(stats.avaliacoes_4_estrelas) || 0,
                    3: parseInt(stats.avaliacoes_3_estrelas) || 0,
                    2: parseInt(stats.avaliacoes_2_estrelas) || 0,
                    1: parseInt(stats.avaliacoes_1_estrela) || 0
                }
            },
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar avaliações do motoboy:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== OBTER AVALIAÇÃO ESPECÍFICA =====
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar acesso baseado no tipo de usuário
        let accessClause = '';
        if (req.user.type === 'usuario') {
            accessClause = 'AND av.usuario_id = $2';
        } else if (req.user.type === 'motoboy') {
            accessClause = 'AND av.motoboy_id = $2';
        }
        
        const result = await executeQuery(
            `SELECT 
                av.*,
                p.codigo_pedido, p.tipo_objeto, p.valor_entrega,
                u.nome as usuario_nome, u.email as usuario_email,
                m.nome as motoboy_nome, m.placa_moto, m.modelo_moto
             FROM avaliacoes av
             JOIN pedidos p ON av.pedido_id = p.id
             JOIN usuarios u ON av.usuario_id = u.id
             JOIN motoboys m ON av.motoboy_id = m.id
             WHERE av.id = $1 ${accessClause}`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Avaliação não encontrada ou sem acesso',
                code: 'EVALUATION_NOT_FOUND'
            });
        }
        
        res.json({
            avaliacao: result.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao buscar avaliação específica:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== REPORTAR AVALIAÇÃO =====
router.post('/:id/reportar', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        if (!motivo || motivo.trim().length < 10) {
            return res.status(400).json({
                error: 'Motivo do report deve ter pelo menos 10 caracteres',
                code: 'INVALID_REPORT_REASON'
            });
        }
        
        // Verificar se a avaliação existe
        const avaliacaoResult = await executeQuery(
            'SELECT id, motoboy_id, reportada FROM avaliacoes WHERE id = $1',
            [id]
        );
        
        if (avaliacaoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Avaliação não encontrada',
                code: 'EVALUATION_NOT_FOUND'
            });
        }
        
        const avaliacao = avaliacaoResult.rows[0];
        
        // Verificar se é o motoboy da avaliação (só ele pode reportar)
        if (req.user.type !== 'motoboy' || req.user.id !== avaliacao.motoboy_id) {
            return res.status(403).json({
                error: 'Apenas o motoboy avaliado pode reportar',
                code: 'UNAUTHORIZED_REPORT'
            });
        }
        
        if (avaliacao.reportada) {
            return res.status(400).json({
                error: 'Avaliação já foi reportada',
                code: 'ALREADY_REPORTED'
            });
        }
        
        // Marcar como reportada
        await executeQuery(
            `UPDATE avaliacoes 
             SET reportada = true, motivo_report = $2
             WHERE id = $1`,
            [id, motivo.trim()]
        );
        
        // Log do report
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, motoboy_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'WARN',
                'avaliacoes',
                'report',
                'Avaliação reportada por motoboy',
                JSON.stringify({
                    avaliacao_id: id,
                    motivo: motivo.trim()
                }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Avaliação reportada com sucesso. Nossa equipe irá analisar.',
            avaliacao_id: id
        });
        
    } catch (error) {
        console.error('Erro ao reportar avaliação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ESTATÍSTICAS GERAIS DE AVALIAÇÕES =====
router.get('/stats/geral', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT 
                COUNT(*) as total_avaliacoes,
                AVG(nota_geral) as media_geral_plataforma,
                COUNT(DISTINCT motoboy_id) as motoboys_avaliados,
                COUNT(*) FILTER (WHERE data_avaliacao >= CURRENT_DATE - INTERVAL '30 days') as avaliacoes_mes_atual,
                COUNT(*) FILTER (WHERE nota_geral >= 4) as avaliacoes_positivas,
                COUNT(*) FILTER (WHERE reportada = true) as avaliacoes_reportadas
             FROM avaliacoes 
             WHERE aprovada = true`
        );
        
        const stats = result.rows[0];
        
        res.json({
            estatisticas: {
                total_avaliacoes: parseInt(stats.total_avaliacoes) || 0,
                media_geral_plataforma: parseFloat(stats.media_geral_plataforma) || 0,
                motoboys_avaliados: parseInt(stats.motoboys_avaliados) || 0,
                avaliacoes_mes_atual: parseInt(stats.avaliacoes_mes_atual) || 0,
                avaliacoes_positivas: parseInt(stats.avaliacoes_positivas) || 0,
                avaliacoes_reportadas: parseInt(stats.avaliacoes_reportadas) || 0,
                taxa_satisfacao: stats.total_avaliacoes > 0 ? 
                    ((parseInt(stats.avaliacoes_positivas) / parseInt(stats.total_avaliacoes)) * 100).toFixed(2) : 0
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas gerais:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;