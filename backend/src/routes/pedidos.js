const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireUser } = require('../middleware/auth');

const router = express.Router();

// Função para calcular preço da entrega
const calcularPrecoEntrega = (distancia, urgencia, opcoes = {}) => {
    let precoBase = 8.00; // Taxa base
    let precoPorKm = 2.50; // Taxa por km
    
    // Calcular preço base
    let precoTotal = precoBase + (distancia * precoPorKm);
    
    // Aplicar taxa de urgência
    switch (urgencia) {
        case 'expressa':
            precoTotal += 5.00;
            break;
        case 'ultra':
            precoTotal += 10.00;
            break;
        case 'economica':
            precoTotal -= 2.00;
            break;
        default: // normal
            break;
    }
    
    // Opções adicionais
    if (opcoes.seguro_adicional) precoTotal += 5.00;
    if (opcoes.embalagem_especial) precoTotal += 3.00;
    if (opcoes.entrega_agendada) precoTotal += 2.00;
    
    return Math.max(precoTotal, 5.00); // Preço mínimo
};

// Função para estimar tempo de entrega
const estimarTempoEntrega = (distancia, urgencia) => {
    let tempoBase = Math.ceil(distancia * 3); // 3 minutos por km base
    
    switch (urgencia) {
        case 'ultra':
            return Math.max(tempoBase * 0.5, 15); // Muito rápido, mínimo 15min
        case 'expressa':
            return Math.max(tempoBase * 0.7, 20); // Rápido, mínimo 20min
        case 'normal':
            return Math.max(tempoBase, 25); // Normal, mínimo 25min
        case 'economica':
            return Math.max(tempoBase * 1.5, 45); // Econômico, mínimo 45min
        default:
            return Math.max(tempoBase, 25);
    }
};

// ===== CRIAR NOVO PEDIDO =====
router.post('/', authenticateToken, requireUser, async (req, res) => {
    try {
        const {
            tipo_objeto,
            empresa_origem,
            descricao,
            observacoes,
            endereco_coleta,
            endereco_entrega,
            latitude_coleta,
            longitude_coleta,
            latitude_entrega,
            longitude_entrega,
            urgencia = 'normal',
            seguro_adicional = false,
            embalagem_especial = false,
            entrega_agendada = false,
            data_agendamento
        } = req.body;
        
        // Validações obrigatórias
        if (!tipo_objeto || !endereco_coleta || !endereco_entrega) {
            return res.status(400).json({
                error: 'Campos obrigatórios: tipo_objeto, endereco_coleta, endereco_entrega',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        // Validar urgência
        const urgenciasValidas = ['economica', 'normal', 'expressa', 'ultra'];
        if (!urgenciasValidas.includes(urgencia)) {
            return res.status(400).json({
                error: 'Urgência inválida',
                code: 'INVALID_URGENCY',
                valid_options: urgenciasValidas
            });
        }
        
        // Validar entrega agendada
        if (entrega_agendada && !data_agendamento) {
            return res.status(400).json({
                error: 'Data de agendamento é obrigatória para entrega agendada',
                code: 'MISSING_SCHEDULE_DATE'
            });
        }
        
        if (data_agendamento) {
            const agendamento = new Date(data_agendamento);
            const agora = new Date();
            
            if (agendamento <= agora) {
                return res.status(400).json({
                    error: 'Data de agendamento deve ser futura',
                    code: 'INVALID_SCHEDULE_DATE'
                });
            }
        }
        
        // Calcular distância se as coordenadas foram fornecidas
        let distancia = null;
        if (latitude_coleta && longitude_coleta && latitude_entrega && longitude_entrega) {
            const distanciaResult = await executeQuery(
                'SELECT calcular_distancia($1, $2, $3, $4) as distancia',
                [latitude_coleta, longitude_coleta, latitude_entrega, longitude_entrega]
            );
            distancia = parseFloat(distanciaResult.rows[0].distancia);
        }
        
        // Se não tem distância, estimar baseado nos endereços (simplificado)
        if (!distancia) {
            distancia = 5.0; // Distância padrão para cálculo
        }
        
        // Calcular preço e tempo estimado
        const opcoes = { seguro_adicional, embalagem_especial, entrega_agendada };
        const valor_entrega = calcularPrecoEntrega(distancia, urgencia, opcoes);
        const tempo_estimado = estimarTempoEntrega(distancia, urgencia);
        
        // Criar pedido
        const pedidoResult = await executeQuery(
            `INSERT INTO pedidos (
                usuario_id, tipo_objeto, empresa_origem, descricao, observacoes,
                endereco_coleta, endereco_entrega,
                latitude_coleta, longitude_coleta, latitude_entrega, longitude_entrega,
                valor_entrega, distancia_km, tempo_estimado, urgencia,
                seguro_adicional, embalagem_especial, entrega_agendada, data_agendamento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING id, codigo_pedido, valor_entrega, tempo_estimado`,
            [
                req.user.id, tipo_objeto, empresa_origem, descricao, observacoes,
                endereco_coleta, endereco_entrega,
                latitude_coleta, longitude_coleta, latitude_entrega, longitude_entrega,
                valor_entrega, distancia, tempo_estimado, urgencia,
                seguro_adicional, embalagem_especial, entrega_agendada, data_agendamento
            ]
        );
        
        const novoPedido = pedidoResult.rows[0];
        
        // Log da criação
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'pedidos',
                'create',
                'Novo pedido criado',
                JSON.stringify({
                    pedido_id: novoPedido.id,
                    codigo: novoPedido.codigo_pedido,
                    valor: valor_entrega,
                    urgencia: urgencia
                }),
                req.user.id
            ]
        );
        
        res.status(201).json({
            message: 'Pedido criado com sucesso',
            pedido: {
                id: novoPedido.id,
                codigo_pedido: novoPedido.codigo_pedido,
                valor_entrega: novoPedido.valor_entrega,
                tempo_estimado: novoPedido.tempo_estimado,
                status: 'pendente'
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== CALCULAR PREÇO DA ENTREGA =====
router.post('/calcular-preco', authenticateToken, requireUser, async (req, res) => {
    try {
        const {
            latitude_coleta,
            longitude_coleta,
            latitude_entrega,
            longitude_entrega,
            urgencia = 'normal',
            seguro_adicional = false,
            embalagem_especial = false,
            entrega_agendada = false
        } = req.body;
        
        // Validar coordenadas
        if (!latitude_coleta || !longitude_coleta || !latitude_entrega || !longitude_entrega) {
            return res.status(400).json({
                error: 'Coordenadas de coleta e entrega são obrigatórias',
                code: 'MISSING_COORDINATES'
            });
        }
        
        // Calcular distância
        const distanciaResult = await executeQuery(
            'SELECT calcular_distancia($1, $2, $3, $4) as distancia',
            [latitude_coleta, longitude_coleta, latitude_entrega, longitude_entrega]
        );
        
        const distancia = parseFloat(distanciaResult.rows[0].distancia);
        
        // Calcular preço e tempo
        const opcoes = { seguro_adicional, embalagem_especial, entrega_agendada };
        const valor_entrega = calcularPrecoEntrega(distancia, urgencia, opcoes);
        const tempo_estimado = estimarTempoEntrega(distancia, urgencia);
        
        // Breakdown do preço
        const breakdown = {
            taxa_base: 8.00,
            taxa_distancia: distancia * 2.50,
            taxa_urgencia: urgencia === 'expressa' ? 5.00 : urgencia === 'ultra' ? 10.00 : urgencia === 'economica' ? -2.00 : 0,
            seguro_adicional: seguro_adicional ? 5.00 : 0,
            embalagem_especial: embalagem_especial ? 3.00 : 0,
            entrega_agendada: entrega_agendada ? 2.00 : 0
        };
        
        res.json({
            distancia_km: distancia,
            valor_entrega: valor_entrega,
            tempo_estimado_minutos: tempo_estimado,
            breakdown: breakdown,
            opcoes: {
                urgencia,
                seguro_adicional,
                embalagem_especial,
                entrega_agendada
            }
        });
        
    } catch (error) {
        console.error('Erro ao calcular preço:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== OBTER PEDIDO ESPECÍFICO =====
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se o usuário tem acesso ao pedido
        let accessQuery = '';
        if (req.user.type === 'usuario') {
            accessQuery = 'AND p.usuario_id = $2';
        } else if (req.user.type === 'motoboy') {
            accessQuery = 'AND p.motoboy_id = $2';
        }
        
        const result = await executeQuery(
            `SELECT 
                p.*,
                u.nome as usuario_nome, u.telefone as usuario_telefone, u.email as usuario_email,
                m.nome as motoboy_nome, m.telefone as motoboy_telefone, m.placa_moto, m.modelo_moto,
                av.nota_geral as avaliacao_nota, av.comentario as avaliacao_comentario
             FROM pedidos p
             JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN motoboys m ON p.motoboy_id = m.id
             LEFT JOIN avaliacoes av ON p.id = av.pedido_id
             WHERE p.id = $1 ${accessQuery}`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado ou sem acesso',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = result.rows[0];
        
        // Buscar histórico
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
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== RASTREAR PEDIDO =====
router.get('/:id/rastrear', async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo } = req.query;
        
        let whereClause = 'WHERE p.id = $1';
        const values = [id];
        
        // Se foi fornecido código, permitir busca pública
        if (codigo) {
            whereClause = 'WHERE p.codigo_pedido = $1';
            values[0] = codigo;
        }
        
        const result = await executeQuery(
            `SELECT 
                p.id, p.codigo_pedido, p.status, p.data_criacao, p.data_coleta, p.data_entrega,
                p.endereco_coleta, p.endereco_entrega, p.tempo_estimado,
                m.nome as motoboy_nome, m.telefone as motoboy_telefone, m.placa_moto,
                m.latitude as motoboy_latitude, m.longitude as motoboy_longitude, m.ultima_localizacao
             FROM pedidos p
             LEFT JOIN motoboys m ON p.motoboy_id = m.id
             ${whereClause}`,
            values
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = result.rows[0];
        
        // Buscar últimas atualizações de status
        const statusResult = await executeQuery(
            `SELECT status_novo, timestamp_mudanca, observacoes
             FROM pedido_historico
             WHERE pedido_id = $1
             ORDER BY timestamp_mudanca DESC
             LIMIT 5`,
            [pedido.id]
        );
        
        res.json({
            tracking: {
                ...pedido,
                status_history: statusResult.rows
            }
        });
        
    } catch (error) {
        console.error('Erro ao rastrear pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== ATUALIZAR STATUS DO PEDIDO (MOTOBOY) =====
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, observacoes, latitude, longitude } = req.body;
        
        // Verificar se é motoboy responsável pelo pedido
        if (req.user.type !== 'motoboy') {
            return res.status(403).json({
                error: 'Apenas motoboys podem atualizar status',
                code: 'UNAUTHORIZED'
            });
        }
        
        // Validar status
        const statusValidos = ['aceito', 'coletado', 'em_transito', 'entregue', 'cancelado', 'problemas'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({
                error: 'Status inválido',
                code: 'INVALID_STATUS',
                valid_options: statusValidos
            });
        }
        
        // Verificar se o pedido pertence ao motoboy
        const pedidoResult = await executeQuery(
            'SELECT id, status as status_atual, motoboy_id FROM pedidos WHERE id = $1',
            [id]
        );
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }
        
        const pedido = pedidoResult.rows[0];
        
        if (pedido.motoboy_id !== req.user.id) {
            return res.status(403).json({
                error: 'Pedido não pertence a este motoboy',
                code: 'ORDER_NOT_OWNED'
            });
        }
        
        // Validar transição de status
        const transicoesValidas = {
            'aceito': ['coletado', 'cancelado', 'problemas'],
            'coletado': ['em_transito', 'problemas'],
            'em_transito': ['entregue', 'problemas'],
            'problemas': ['coletado', 'em_transito', 'cancelado']
        };
        
        const statusAtual = pedido.status_atual;
        if (transicoesValidas[statusAtual] && !transicoesValidas[statusAtual].includes(status)) {
            return res.status(400).json({
                error: `Transição de '${statusAtual}' para '${status}' não permitida`,
                code: 'INVALID_STATUS_TRANSITION',
                current_status: statusAtual,
                allowed_transitions: transicoesValidas[statusAtual]
            });
        }
        
        // Atualizar pedido
        const camposUpdate = ['status = $2'];
        const valoresUpdate = [id, status];
        let paramCount = 3;
        
        if (status === 'coletado') {
            camposUpdate.push(`data_coleta = CURRENT_TIMESTAMP`);
        } else if (status === 'entregue') {
            camposUpdate.push(`data_entrega = CURRENT_TIMESTAMP`);
        }
        
        const updateQuery = `
            UPDATE pedidos 
            SET ${camposUpdate.join(', ')}
            WHERE id = $1
            RETURNING status, data_coleta, data_entrega
        `;
        
        const updateResult = await executeQuery(updateQuery, valoresUpdate);
        
        // Registrar no histórico
        await executeQuery(
            `INSERT INTO pedido_historico (
                pedido_id, status_anterior, status_novo, observacoes, latitude, longitude
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, statusAtual, status, observacoes, latitude, longitude]
        );
        
        // Log da atualização
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, motoboy_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'INFO',
                'pedidos',
                'status_update',
                'Status do pedido atualizado',
                JSON.stringify({
                    pedido_id: id,
                    status_anterior: statusAtual,
                    status_novo: status,
                    observacoes: observacoes
                }),
                req.user.id
            ]
        );
        
        res.json({
            message: 'Status atualizado com sucesso',
            pedido: updateResult.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ===== LISTAR PEDIDOS (GERAL) =====
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, urgencia, limit = 20, offset = 0 } = req.query;
        
        // Construir filtros baseado no tipo de usuário
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 1;
        
        if (req.user.type === 'usuario') {
            whereClause += ` AND p.usuario_id = $${paramCount++}`;
            values.push(req.user.id);
        } else if (req.user.type === 'motoboy') {
            whereClause += ` AND p.motoboy_id = $${paramCount++}`;
            values.push(req.user.id);
        }
        
        if (status) {
            whereClause += ` AND p.status = $${paramCount++}`;
            values.push(status);
        }
        
        if (urgencia) {
            whereClause += ` AND p.urgencia = $${paramCount++}`;
            values.push(urgencia);
        }
        
        const query = `
            SELECT 
                p.id, p.codigo_pedido, p.tipo_objeto, p.empresa_origem,
                p.endereco_coleta, p.endereco_entrega, p.valor_entrega,
                p.urgencia, p.status, p.data_criacao,
                u.nome as usuario_nome,
                m.nome as motoboy_nome
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN motoboys m ON p.motoboy_id = m.id
            ${whereClause}
            ORDER BY p.data_criacao DESC
            LIMIT $${paramCount++} OFFSET $${paramCount}
        `;
        
        values.push(parseInt(limit), parseInt(offset));
        
        const result = await executeQuery(query, values);
        
        res.json({
            pedidos: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;