-- ===== DADOS DE TESTE PARA DESENVOLVIMENTO =====
-- DropPoint - Dados simulados para testes

-- Limpar dados existentes (cuidado em produção!)
-- DELETE FROM avaliacoes;
-- DELETE FROM mensagens;
-- DELETE FROM notificacoes;
-- DELETE FROM pedido_historico;
-- DELETE FROM pedidos;
-- DELETE FROM sessoes;
-- DELETE FROM motoboys WHERE email LIKE '%@teste.com';
-- DELETE FROM usuarios WHERE email LIKE '%@teste.com';

-- ===== USUÁRIOS DE TESTE =====

INSERT INTO usuarios (nome, email, telefone, senha_hash, endereco_principal, verificado, email_verificado) VALUES
('João Silva', 'joao@teste.com', '(11) 99999-1111', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K', 
 'Rua das Flores, 123, São Paulo - SP', true, true),

('Maria Santos', 'maria@teste.com', '(11) 99999-2222', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K', 
 'Av. Paulista, 456, São Paulo - SP', true, true),

('Pedro Oliveira', 'pedro@teste.com', '(11) 99999-3333', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K', 
 'Rua Augusta, 789, São Paulo - SP', true, true),

('Ana Costa', 'ana@teste.com', '(11) 99999-4444', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K', 
 'Rua Oscar Freire, 321, São Paulo - SP', true, true),

('Carlos Mendes', 'carlos@teste.com', '(11) 99999-5555', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K', 
 'Rua da Consolação, 654, São Paulo - SP', true, true)

ON CONFLICT (email) DO NOTHING;

-- ===== MOTOBOYS DE TESTE =====

INSERT INTO motoboys (
    nome, email, telefone, cpf, cnh, senha_hash, 
    placa_moto, modelo_moto, cor_moto, ano_moto,
    status, aprovado, verificado, disponivel, online,
    latitude, longitude, ultima_localizacao,
    total_entregas, entregas_concluidas, avaliacao_media
) VALUES
('Roberto Moto', 'roberto@moto.teste.com', '(11) 98888-1111', 
 '123.456.789-01', 'CNH123456', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K',
 'ABC-1234', 'Honda CG 160', 'Azul', 2022,
 'ativo', true, true, true, true,
 -23.5505, -46.6333, CURRENT_TIMESTAMP,
 85, 80, 4.8),

('Diego Entrega', 'diego@moto.teste.com', '(11) 98888-2222', 
 '987.654.321-01', 'CNH654321',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K',
 'XYZ-5678', 'Yamaha Factor 125', 'Vermelha', 2021,
 'ativo', true, true, true, true,
 -23.5618, -46.6565, CURRENT_TIMESTAMP,
 67, 62, 4.6),

('Marcos Veloz', 'marcos@moto.teste.com', '(11) 98888-3333',
 '456.789.123-01', 'CNH789123',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K',
 'DEF-9012', 'Honda Titan 160', 'Preta', 2023,
 'ativo', true, true, true, false,
 -23.5489, -46.6388, CURRENT_TIMESTAMP - INTERVAL '2 hours',
 42, 40, 4.9),

('Fernanda Express', 'fernanda@moto.teste.com', '(11) 98888-4444',
 '321.654.987-01', 'CNH987654',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K',
 'GHI-3456', 'Yamaha YBR 150', 'Branca', 2020,
 'ativo', true, true, false, false,
 -23.5733, -46.6417, CURRENT_TIMESTAMP - INTERVAL '1 hour',
 95, 88, 4.7),

('Lucas Rápido', 'lucas@moto.teste.com', '(11) 98888-5555',
 '789.123.456-01', 'CNH456789',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K',
 'JKL-7890', 'Honda CB 600F', 'Azul', 2019,
 'pendente', false, false, false, false,
 -23.5440, -46.6396, CURRENT_TIMESTAMP - INTERVAL '3 hours',
 0, 0, 0.0)

ON CONFLICT (email) DO NOTHING;

-- ===== PEDIDOS DE TESTE =====

-- Inserir usuários e motoboys IDs em variáveis para referência
DO $$
DECLARE
    user_joao UUID;
    user_maria UUID;
    user_pedro UUID;
    user_ana UUID;
    moto_roberto UUID;
    moto_diego UUID;
    moto_marcos UUID;
    moto_fernanda UUID;
BEGIN
    -- Buscar IDs dos usuários
    SELECT id INTO user_joao FROM usuarios WHERE email = 'joao@teste.com';
    SELECT id INTO user_maria FROM usuarios WHERE email = 'maria@teste.com';
    SELECT id INTO user_pedro FROM usuarios WHERE email = 'pedro@teste.com';
    SELECT id INTO user_ana FROM usuarios WHERE email = 'ana@teste.com';
    
    -- Buscar IDs dos motoboys
    SELECT id INTO moto_roberto FROM motoboys WHERE email = 'roberto@moto.teste.com';
    SELECT id INTO moto_diego FROM motoboys WHERE email = 'diego@moto.teste.com';
    SELECT id INTO moto_marcos FROM motoboys WHERE email = 'marcos@moto.teste.com';
    SELECT id INTO moto_fernanda FROM motoboys WHERE email = 'fernanda@moto.teste.com';
    
    -- Pedido 1: Entregue
    INSERT INTO pedidos (
        codigo_pedido, usuario_id, motoboy_id,
        tipo_objeto, empresa_origem, descricao,
        endereco_coleta, endereco_entrega,
        latitude_coleta, longitude_coleta,
        latitude_entrega, longitude_entrega,
        valor_entrega, distancia_km, tempo_estimado, urgencia,
        status, data_criacao, data_aceito, data_coleta, data_entrega,
        seguro_adicional, codigo_coleta, codigo_entrega
    ) VALUES (
        'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '0001', user_joao, moto_roberto,
        'eletronico', 'Amazon', 'Smartphone Samsung Galaxy S23',
        'Rua das Palmeiras, 100, Centro - São Paulo/SP',
        'Rua das Flores, 123, Jardins - São Paulo/SP',
        -23.5475, -46.6361, -23.5505, -46.6333,
        15.50, 3.2, 25, 'normal',
        'entregue', 
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes',
        CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes',
        CURRENT_TIMESTAMP - INTERVAL '30 minutes',
        true, 'COL001', 'ENT001'
    );
    
    -- Pedido 2: Em trânsito
    INSERT INTO pedidos (
        codigo_pedido, usuario_id, motoboy_id,
        tipo_objeto, empresa_origem, descricao,
        endereco_coleta, endereco_entrega,
        latitude_coleta, longitude_coleta,
        latitude_entrega, longitude_entrega,
        valor_entrega, distancia_km, tempo_estimado, urgencia,
        status, data_criacao, data_aceito, data_coleta,
        codigo_coleta, codigo_entrega
    ) VALUES (
        'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '0002', user_maria, moto_diego,
        'cosmeticos', 'Sephora', 'Kit de maquiagem Fenty Beauty',
        'Shopping Iguatemi, Av. Brigadeiro Faria Lima - São Paulo/SP',
        'Av. Paulista, 456, Bela Vista - São Paulo/SP',
        -23.5456, -46.6575, -23.5618, -46.6565,
        12.00, 2.8, 20, 'expressa',
        'em_transito',
        CURRENT_TIMESTAMP - INTERVAL '45 minutes',
        CURRENT_TIMESTAMP - INTERVAL '35 minutes',
        CURRENT_TIMESTAMP - INTERVAL '15 minutes',
        'COL002', 'ENT002'
    );
    
    -- Pedido 3: Aceito (aguardando coleta)
    INSERT INTO pedidos (
        codigo_pedido, usuario_id, motoboy_id,
        tipo_objeto, empresa_origem, descricao,
        endereco_coleta, endereco_entrega,
        latitude_coleta, longitude_coleta,
        latitude_entrega, longitude_entrega,
        valor_entrega, distancia_km, tempo_estimado, urgencia,
        status, data_criacao, data_aceito,
        embalagem_especial, codigo_coleta, codigo_entrega
    ) VALUES (
        'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '0003', user_pedro, moto_marcos,
        'livros', 'Saraiva', 'Box Harry Potter - Edição Especial',
        'Livraria Saraiva, Rua 24 de Maio - São Paulo/SP',
        'Rua Augusta, 789, Consolação - São Paulo/SP',
        -23.5440, -46.6396, -23.5489, -46.6388,
        18.75, 4.1, 30, 'normal',
        'aceito',
        CURRENT_TIMESTAMP - INTERVAL '20 minutes',
        CURRENT_TIMESTAMP - INTERVAL '10 minutes',
        true, 'COL003', 'ENT003'
    );
    
    -- Pedido 4: Pendente
    INSERT INTO pedidos (
        codigo_pedido, usuario_id,
        tipo_objeto, empresa_origem, descricao,
        endereco_coleta, endereco_entrega,
        latitude_coleta, longitude_coleta,
        latitude_entrega, longitude_entrega,
        valor_entrega, distancia_km, tempo_estimado, urgencia,
        status, data_criacao,
        entrega_agendada, data_agendamento
    ) VALUES (
        'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '0004', user_ana,
        'roupa', 'Zara', 'Vestido estampado tamanho M',
        'Zara Store, Shopping Cidade Jardim - São Paulo/SP',
        'Rua Oscar Freire, 321, Jardins - São Paulo/SP',
        -23.5733, -46.6417, -23.5744, -46.6422,
        22.30, 5.7, 40, 'ultra',
        'pendente',
        CURRENT_TIMESTAMP - INTERVAL '5 minutes',
        true, CURRENT_TIMESTAMP + INTERVAL '2 hours'
    );
    
    -- Pedido 5: Cancelado
    INSERT INTO pedidos (
        codigo_pedido, usuario_id,
        tipo_objeto, empresa_origem, descricao,
        endereco_coleta, endereco_entrega,
        valor_entrega, distancia_km, urgencia,
        status, data_criacao, data_cancelamento,
        cancelado_por, motivo_cancelamento
    ) VALUES (
        'DP' || TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYMMDD') || '0001', user_joao,
        'outros', 'Americanas', 'Produto com defeito',
        'Loja Americanas, Rua do Comércio - São Paulo/SP',
        'Rua das Flores, 123, Jardins - São Paulo/SP',
        25.00, 6.2, 'normal',
        'cancelado',
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP - INTERVAL '23 hours',
        'usuario', 'Produto chegou com defeito na loja'
    );

END $$;

-- ===== HISTÓRICO DE STATUS =====

-- Adicionar histórico para os pedidos ativos
INSERT INTO pedido_historico (pedido_id, status_anterior, status_novo, observacoes, timestamp_mudanca)
SELECT 
    p.id,
    NULL,
    'pendente',
    'Pedido criado pelo usuário',
    p.data_criacao
FROM pedidos p
WHERE p.codigo_pedido LIKE 'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '%';

-- ===== AVALIAÇÕES DE TESTE =====

-- Avaliação para o pedido entregue
INSERT INTO avaliacoes (
    pedido_id, usuario_id, motoboy_id,
    nota_geral, nota_pontualidade, nota_cuidado, nota_atendimento,
    comentario, pontos_positivos, data_avaliacao
)
SELECT 
    p.id, p.usuario_id, p.motoboy_id,
    5, 5, 5, 4,
    'Excelente serviço! Motoboy muito educado e pontual.',
    'Pontualidade, educação, cuidado com o produto',
    CURRENT_TIMESTAMP - INTERVAL '25 minutes'
FROM pedidos p
WHERE p.codigo_pedido LIKE 'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '0001';

-- Mais algumas avaliações históricas
DO $$
DECLARE
    moto_roberto UUID;
    moto_diego UUID;
    user_joao UUID;
    user_maria UUID;
BEGIN
    SELECT id INTO moto_roberto FROM motoboys WHERE email = 'roberto@moto.teste.com';
    SELECT id INTO moto_diego FROM motoboys WHERE email = 'diego@moto.teste.com';
    SELECT id INTO user_joao FROM usuarios WHERE email = 'joao@teste.com';
    SELECT id INTO user_maria FROM usuarios WHERE email = 'maria@teste.com';
    
    -- Avaliações fictícias para manter as médias
    INSERT INTO avaliacoes (pedido_id, usuario_id, motoboy_id, nota_geral, nota_pontualidade, nota_cuidado, nota_atendimento, comentario, data_avaliacao)
    VALUES 
    (uuid_generate_v4(), user_joao, moto_roberto, 5, 5, 4, 5, 'Ótimo profissional!', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (uuid_generate_v4(), user_maria, moto_roberto, 4, 4, 5, 5, 'Muito cuidadoso com a entrega.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (uuid_generate_v4(), user_joao, moto_diego, 5, 4, 4, 5, 'Rápido e eficiente.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (uuid_generate_v4(), user_maria, moto_diego, 4, 5, 4, 4, 'Entrega no prazo combinado.', CURRENT_TIMESTAMP - INTERVAL '4 days');
END $$;

-- ===== MENSAGENS DE TESTE =====

-- Mensagens para o pedido em trânsito
DO $$
DECLARE
    pedido_transito UUID;
    user_maria UUID;
    moto_diego UUID;
BEGIN
    SELECT p.id, p.usuario_id, p.motoboy_id INTO pedido_transito, user_maria, moto_diego 
    FROM pedidos p 
    WHERE p.codigo_pedido LIKE 'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '0002';
    
    INSERT INTO mensagens (pedido_id, remetente_tipo, remetente_id, destinatario_tipo, destinatario_id, conteudo, timestamp_envio)
    VALUES 
    (pedido_transito, 'sistema', NULL, 'usuario', user_maria, 'Seu pedido foi aceito pelo motoboy Diego!', CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
    (pedido_transito, 'motoboy', moto_diego, 'usuario', user_maria, 'Olá! Estou a caminho da coleta. Chegando em 5 minutos!', CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
    (pedido_transito, 'usuario', user_maria, 'motoboy', moto_diego, 'Perfeito! Obrigada pelo contato.', CURRENT_TIMESTAMP - INTERVAL '18 minutes'),
    (pedido_transito, 'motoboy', moto_diego, 'usuario', user_maria, 'Produto coletado! Agora seguindo para entrega. ETA: 15 minutos.', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    (pedido_transito, 'sistema', NULL, 'usuario', user_maria, 'Seu pedido foi coletado e está a caminho!', CURRENT_TIMESTAMP - INTERVAL '15 minutes');
END $$;

-- ===== NOTIFICAÇÕES DE TESTE =====

-- Notificações para diferentes usuários
DO $$
DECLARE
    user_joao UUID;
    user_maria UUID;
    user_pedro UUID;
    moto_roberto UUID;
    moto_diego UUID;
BEGIN
    SELECT id INTO user_joao FROM usuarios WHERE email = 'joao@teste.com';
    SELECT id INTO user_maria FROM usuarios WHERE email = 'maria@teste.com';
    SELECT id INTO user_pedro FROM usuarios WHERE email = 'pedro@teste.com';
    SELECT id INTO moto_roberto FROM motoboys WHERE email = 'roberto@moto.teste.com';
    SELECT id INTO moto_diego FROM motoboys WHERE email = 'diego@moto.teste.com';
    
    INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, icon, push_enviado, timestamp_criacao, lida)
    VALUES 
    (user_joao, 'entrega_concluida', 'Entrega Concluída!', 'Seu pedido foi entregue com sucesso. Avalie o serviço!', '✅', true, CURRENT_TIMESTAMP - INTERVAL '25 minutes', true),
    (user_maria, 'pedido_em_transito', 'Pedido a Caminho!', 'Diego está levando seu pedido. Chegada em 10 minutos.', '🚚', true, CURRENT_TIMESTAMP - INTERVAL '10 minutes', false),
    (user_pedro, 'pedido_aceito', 'Pedido Aceito!', 'Marcos aceitou seu pedido e está indo buscar.', '🏍️', true, CURRENT_TIMESTAMP - INTERVAL '8 minutes', false);
    
    INSERT INTO notificacoes (motoboy_id, tipo, titulo, mensagem, icon, push_enviado, timestamp_criacao, lida)
    VALUES 
    (moto_roberto, 'avaliacao_recebida', 'Nova Avaliação!', 'Você recebeu 5 estrelas no último pedido!', '⭐', true, CURRENT_TIMESTAMP - INTERVAL '20 minutes', true),
    (moto_diego, 'novo_pedido_disponivel', 'Novo Pedido!', 'Pedido urgente disponível na sua região.', '📦', true, CURRENT_TIMESTAMP - INTERVAL '5 minutes', false);
END $$;

-- ===== SESSÕES ATIVAS DE TESTE =====

DO $$
DECLARE
    user_joao UUID;
    user_maria UUID;
    moto_roberto UUID;
    moto_diego UUID;
BEGIN
    SELECT id INTO user_joao FROM usuarios WHERE email = 'joao@teste.com';
    SELECT id INTO user_maria FROM usuarios WHERE email = 'maria@teste.com';
    SELECT id INTO moto_roberto FROM motoboys WHERE email = 'roberto@moto.teste.com';
    SELECT id INTO moto_diego FROM motoboys WHERE email = 'diego@moto.teste.com';
    
    INSERT INTO sessoes (usuario_id, token_hash, dispositivo, navegador, ip_origem, data_expiracao, ativa)
    VALUES 
    (user_joao, MD5('token_joao_' || CURRENT_TIMESTAMP), 'iPhone 14', 'Safari Mobile', '192.168.1.100', CURRENT_TIMESTAMP + INTERVAL '24 hours', true),
    (user_maria, MD5('token_maria_' || CURRENT_TIMESTAMP), 'Samsung Galaxy S23', 'Chrome Mobile', '192.168.1.101', CURRENT_TIMESTAMP + INTERVAL '24 hours', true);
    
    INSERT INTO sessoes (motoboy_id, token_hash, dispositivo, navegador, ip_origem, data_expiracao, ativa)
    VALUES 
    (moto_roberto, MD5('token_roberto_' || CURRENT_TIMESTAMP), 'Xiaomi Redmi Note', 'Chrome Mobile', '192.168.1.102', CURRENT_TIMESTAMP + INTERVAL '24 hours', true),
    (moto_diego, MD5('token_diego_' || CURRENT_TIMESTAMP), 'Motorola Edge 30', 'Chrome Mobile', '192.168.1.103', CURRENT_TIMESTAMP + INTERVAL '24 hours', true);
END $$;

-- ===== LOGS DE SISTEMA =====

INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, timestamp_log)
VALUES 
('INFO', 'database', 'seed', 'Dados de teste inseridos com sucesso', 
 '{"usuarios": 5, "motoboys": 5, "pedidos": 5, "avaliacoes": 5}', CURRENT_TIMESTAMP),
('INFO', 'auth', 'login', 'Login bem-sucedido', 
 '{"user_type": "usuario", "ip": "192.168.1.100"}', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('INFO', 'pedidos', 'create', 'Novo pedido criado', 
 '{"codigo": "DP2510290004", "valor": 22.30}', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
('WARN', 'auth', 'login', 'Tentativa de login com senha incorreta', 
 '{"email": "teste@invalid.com", "ip": "192.168.1.200"}', CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- Atualizar estatísticas finais dos motoboys (após as avaliações)
UPDATE motoboys SET 
    avaliacao_media = (
        SELECT ROUND(AVG(nota_geral), 2) 
        FROM avaliacoes 
        WHERE motoboy_id = motoboys.id
    ),
    total_avaliacoes = (
        SELECT COUNT(*) 
        FROM avaliacoes 
        WHERE motoboy_id = motoboys.id
    )
WHERE email LIKE '%@moto.teste.com';

-- Log final
INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto, timestamp_log)
VALUES ('INFO', 'database', 'seed', 'Seed data completed successfully', 
        '{"timestamp": "' || CURRENT_TIMESTAMP || '", "environment": "development"}', CURRENT_TIMESTAMP);

-- Mostrar resumo dos dados inseridos
DO $$
DECLARE
    total_usuarios INTEGER;
    total_motoboys INTEGER;
    total_pedidos INTEGER;
    total_avaliacoes INTEGER;
    total_mensagens INTEGER;
    total_notificacoes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_usuarios FROM usuarios WHERE email LIKE '%@teste.com';
    SELECT COUNT(*) INTO total_motoboys FROM motoboys WHERE email LIKE '%@moto.teste.com';
    SELECT COUNT(*) INTO total_pedidos FROM pedidos WHERE codigo_pedido LIKE 'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '%';
    SELECT COUNT(*) INTO total_avaliacoes FROM avaliacoes;
    SELECT COUNT(*) INTO total_mensagens FROM mensagens;
    SELECT COUNT(*) INTO total_notificacoes FROM notificacoes;
    
    RAISE NOTICE '=== DADOS DE TESTE INSERIDOS ===';
    RAISE NOTICE 'Usuários: %', total_usuarios;
    RAISE NOTICE 'Motoboys: %', total_motoboys;
    RAISE NOTICE 'Pedidos: %', total_pedidos;
    RAISE NOTICE 'Avaliações: %', total_avaliacoes;
    RAISE NOTICE 'Mensagens: %', total_mensagens;
    RAISE NOTICE 'Notificações: %', total_notificacoes;
    RAISE NOTICE '================================';
END $$;