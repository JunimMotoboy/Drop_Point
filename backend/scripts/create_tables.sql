-- ===== DROPPOINT DATABASE SCHEMA =====
-- Criado em: 29 de outubro de 2025
-- Sistema de entregas DropPoint

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== TABELA DE USUÁRIOS =====
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    endereco_principal TEXT,
    
    -- Status e verificação
    status VARCHAR(20) DEFAULT 'ativo',
    verificado BOOLEAN DEFAULT false,
    email_verificado BOOLEAN DEFAULT false,
    telefone_verificado BOOLEAN DEFAULT false,
    
    -- Timestamps
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Preferências do usuário
    preferencias JSONB DEFAULT '{}',
    
    -- Controles de segurança
    tentativas_login INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP,
    
    CONSTRAINT status_usuario_check CHECK (status IN ('ativo', 'inativo', 'bloqueado'))
);

-- ===== TABELA DE MOTOBOYS =====
CREATE TABLE IF NOT EXISTS motoboys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cnh VARCHAR(20) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    
    -- Informações do veículo
    placa_moto VARCHAR(10) NOT NULL,
    modelo_moto VARCHAR(100) NOT NULL,
    cor_moto VARCHAR(50),
    ano_moto INTEGER,
    
    -- Documentos
    foto_documento VARCHAR(500),
    comprovante_endereco VARCHAR(500),
    documento_moto VARCHAR(500),
    
    -- Status e verificação
    status VARCHAR(20) DEFAULT 'pendente',
    verificado BOOLEAN DEFAULT false,
    aprovado BOOLEAN DEFAULT false,
    disponivel BOOLEAN DEFAULT true,
    online BOOLEAN DEFAULT false,
    
    -- Localização atual
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ultima_localizacao TIMESTAMP,
    
    -- Estatísticas
    total_entregas INTEGER DEFAULT 0,
    entregas_concluidas INTEGER DEFAULT 0,
    entregas_canceladas INTEGER DEFAULT 0,
    avaliacao_media DECIMAL(3, 2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    
    -- Timestamps
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Controles de segurança
    tentativas_login INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP,
    
    CONSTRAINT status_motoboy_check CHECK (status IN ('pendente', 'ativo', 'inativo', 'suspenso', 'bloqueado'))
);

-- ===== TABELA DE PEDIDOS =====
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_pedido VARCHAR(20) UNIQUE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    motoboy_id UUID REFERENCES motoboys(id),
    
    -- Informações do objeto
    tipo_objeto VARCHAR(50) NOT NULL,
    empresa_origem VARCHAR(100),
    descricao TEXT,
    observacoes TEXT,
    
    -- Endereços
    endereco_coleta TEXT NOT NULL,
    endereco_entrega TEXT NOT NULL,
    latitude_coleta DECIMAL(10, 8),
    longitude_coleta DECIMAL(11, 8),
    latitude_entrega DECIMAL(10, 8),
    longitude_entrega DECIMAL(11, 8),
    
    -- Valores e detalhes
    valor_entrega DECIMAL(10, 2),
    distancia_km DECIMAL(8, 2),
    tempo_estimado INTEGER, -- em minutos
    urgencia VARCHAR(20) DEFAULT 'normal',
    
    -- Status do pedido
    status VARCHAR(30) DEFAULT 'pendente',
    
    -- Timestamps importantes
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aceito TIMESTAMP,
    data_coleta TIMESTAMP,
    data_entrega TIMESTAMP,
    data_cancelamento TIMESTAMP,
    
    -- Informações de cancelamento
    cancelado_por VARCHAR(20), -- 'usuario', 'motoboy', 'sistema'
    motivo_cancelamento TEXT,
    
    -- Opções adicionais
    seguro_adicional BOOLEAN DEFAULT false,
    embalagem_especial BOOLEAN DEFAULT false,
    entrega_agendada BOOLEAN DEFAULT false,
    data_agendamento TIMESTAMP,
    
    -- Códigos de confirmação
    codigo_coleta VARCHAR(10),
    codigo_entrega VARCHAR(10),
    
    -- Ratings e feedback
    avaliado BOOLEAN DEFAULT false,
    
    CONSTRAINT status_pedido_check CHECK (status IN (
        'pendente', 'aceito', 'coletado', 'em_transito', 'entregue', 
        'cancelado', 'problemas', 'aguardando_coleta', 'reagendado'
    )),
    CONSTRAINT urgencia_check CHECK (urgencia IN ('economica', 'normal', 'expressa', 'ultra')),
    CONSTRAINT cancelado_por_check CHECK (cancelado_por IN ('usuario', 'motoboy', 'sistema', 'suporte'))
);

-- ===== TABELA DE HISTÓRICO DE STATUS =====
CREATE TABLE IF NOT EXISTS pedido_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    timestamp_mudanca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    
    -- Localização no momento da mudança
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadados
    ip_origem INET,
    user_agent TEXT,
    alterado_por UUID, -- ID do usuário que fez a alteração
    tipo_alteracao VARCHAR(20) DEFAULT 'automatica' -- 'automatica', 'manual', 'sistema'
);

-- ===== TABELA DE AVALIAÇÕES =====
CREATE TABLE IF NOT EXISTS avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    motoboy_id UUID NOT NULL REFERENCES motoboys(id),
    
    -- Avaliações (1-5 estrelas)
    nota_geral INTEGER NOT NULL CHECK (nota_geral BETWEEN 1 AND 5),
    nota_pontualidade INTEGER CHECK (nota_pontualidade BETWEEN 1 AND 5),
    nota_cuidado INTEGER CHECK (nota_cuidado BETWEEN 1 AND 5),
    nota_atendimento INTEGER CHECK (nota_atendimento BETWEEN 1 AND 5),
    
    -- Feedback textual
    comentario TEXT,
    pontos_positivos TEXT,
    pontos_negativos TEXT,
    
    -- Metadados da avaliação
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    anonima BOOLEAN DEFAULT false,
    
    -- Sistema de moderação
    aprovada BOOLEAN DEFAULT true,
    reportada BOOLEAN DEFAULT false,
    motivo_report TEXT,
    moderada_por UUID,
    data_moderacao TIMESTAMP,
    
    -- Evitar avaliações duplicadas
    UNIQUE(pedido_id, usuario_id)
);

-- ===== TABELA DE MENSAGENS/CHAT =====
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    
    -- Participantes da conversa
    remetente_tipo VARCHAR(20) NOT NULL,
    remetente_id UUID,
    destinatario_tipo VARCHAR(20),
    destinatario_id UUID,
    
    -- Conteúdo da mensagem
    conteudo TEXT NOT NULL,
    tipo_mensagem VARCHAR(20) DEFAULT 'texto',
    arquivo_url VARCHAR(500),
    arquivo_nome VARCHAR(255),
    arquivo_tamanho INTEGER,
    
    -- Timestamps
    timestamp_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    editada BOOLEAN DEFAULT false,
    timestamp_edicao TIMESTAMP,
    
    -- Status de leitura
    lida BOOLEAN DEFAULT false,
    timestamp_leitura TIMESTAMP,
    
    -- Metadados
    ip_origem INET,
    dispositivo VARCHAR(100),
    
    CONSTRAINT remetente_tipo_check CHECK (remetente_tipo IN ('usuario', 'motoboy', 'sistema', 'suporte')),
    CONSTRAINT tipo_mensagem_check CHECK (tipo_mensagem IN ('texto', 'imagem', 'localizacao', 'arquivo', 'audio'))
);

-- ===== TABELA DE NOTIFICAÇÕES =====
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    motoboy_id UUID REFERENCES motoboys(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    
    -- Conteúdo da notificação
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    icon VARCHAR(10),
    
    -- Dados adicionais em JSON
    dados_extras JSONB DEFAULT '{}',
    
    -- URLs de ação
    url_acao VARCHAR(500),
    
    -- Timestamps
    timestamp_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timestamp_agendamento TIMESTAMP,
    
    -- Status de leitura
    lida BOOLEAN DEFAULT false,
    timestamp_leitura TIMESTAMP,
    
    -- Status de envio
    push_enviado BOOLEAN DEFAULT false,
    email_enviado BOOLEAN DEFAULT false,
    sms_enviado BOOLEAN DEFAULT false,
    
    -- Tentativas de envio
    tentativas_push INTEGER DEFAULT 0,
    tentativas_email INTEGER DEFAULT 0,
    tentativas_sms INTEGER DEFAULT 0,
    
    -- Prioridade
    prioridade VARCHAR(10) DEFAULT 'normal',
    
    CONSTRAINT prioridade_check CHECK (prioridade IN ('baixa', 'normal', 'alta', 'critica'))
);

-- ===== TABELA DE CONFIGURAÇÕES SISTEMA =====
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    categoria VARCHAR(50) DEFAULT 'geral',
    
    -- Controle de versioning
    versao INTEGER DEFAULT 1,
    ativa BOOLEAN DEFAULT true,
    
    -- Timestamps
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Auditoria
    criada_por VARCHAR(100),
    atualizada_por VARCHAR(100),
    
    CONSTRAINT tipo_config_check CHECK (tipo IN ('string', 'number', 'boolean', 'json', 'array'))
);

-- ===== TABELA DE LOGS DE SISTEMA =====
CREATE TABLE IF NOT EXISTS logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Classificação do log
    nivel VARCHAR(10) NOT NULL,
    categoria VARCHAR(50),
    modulo VARCHAR(50),
    
    -- Conteúdo
    mensagem TEXT NOT NULL,
    contexto JSONB,
    stack_trace TEXT,
    
    -- Timestamps
    timestamp_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Origem da requisição
    ip_origem INET,
    user_agent TEXT,
    endpoint VARCHAR(200),
    metodo_http VARCHAR(10),
    
    -- Usuários relacionados
    usuario_id UUID REFERENCES usuarios(id),
    motoboy_id UUID REFERENCES motoboys(id),
    
    -- Performance
    tempo_resposta INTEGER, -- em millisegundos
    status_http INTEGER,
    
    CONSTRAINT nivel_log_check CHECK (nivel IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'))
);

-- ===== TABELA DE SESSÕES =====
CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    motoboy_id UUID REFERENCES motoboys(id) ON DELETE CASCADE,
    
    -- Dados da sessão
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    
    -- Informações do dispositivo
    dispositivo VARCHAR(100),
    navegador VARCHAR(100),
    sistema_operacional VARCHAR(50),
    ip_origem INET,
    
    -- Timestamps
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    ultimo_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    ativa BOOLEAN DEFAULT true,
    
    -- Geolocalização do login
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    cidade VARCHAR(100),
    pais VARCHAR(50)
);

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_verificado ON usuarios(verificado);

-- Motoboys
CREATE INDEX IF NOT EXISTS idx_motoboys_email ON motoboys(email);
CREATE INDEX IF NOT EXISTS idx_motoboys_cpf ON motoboys(cpf);
CREATE INDEX IF NOT EXISTS idx_motoboys_status ON motoboys(status);
CREATE INDEX IF NOT EXISTS idx_motoboys_disponivel ON motoboys(disponivel);
CREATE INDEX IF NOT EXISTS idx_motoboys_online ON motoboys(online);
CREATE INDEX IF NOT EXISTS idx_motoboys_localizacao ON motoboys(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_motoboys_avaliacao ON motoboys(avaliacao_media);

-- Pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_motoboy ON pedidos(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_criacao ON pedidos(data_criacao);
CREATE INDEX IF NOT EXISTS idx_pedidos_urgencia ON pedidos(urgencia);
CREATE INDEX IF NOT EXISTS idx_pedidos_localizacao_coleta ON pedidos(latitude_coleta, longitude_coleta);
CREATE INDEX IF NOT EXISTS idx_pedidos_localizacao_entrega ON pedidos(latitude_entrega, longitude_entrega);

-- Histórico
CREATE INDEX IF NOT EXISTS idx_historico_pedido ON pedido_historico(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historico_timestamp ON pedido_historico(timestamp_mudanca);
CREATE INDEX IF NOT EXISTS idx_historico_status ON pedido_historico(status_novo);

-- Avaliações
CREATE INDEX IF NOT EXISTS idx_avaliacoes_pedido ON avaliacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_motoboy ON avaliacoes(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario ON avaliacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data_avaliacao);

-- Mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_pedido ON mensagens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp ON mensagens(timestamp_envio);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON mensagens(remetente_tipo, remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON mensagens(lida);

-- Notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_motoboy ON notificacoes(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_timestamp ON notificacoes(timestamp_criacao);

-- Logs
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs_sistema(timestamp_log);
CREATE INDEX IF NOT EXISTS idx_logs_nivel ON logs_sistema(nivel);
CREATE INDEX IF NOT EXISTS idx_logs_categoria ON logs_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_sistema(usuario_id);

-- Sessões
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_motoboy ON sessoes(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativa ON sessoes(ativa);
CREATE INDEX IF NOT EXISTS idx_sessoes_expiracao ON sessoes(data_expiracao);

-- ===== TRIGGERS E FUNÇÕES =====

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para configurações
CREATE OR REPLACE TRIGGER trigger_config_timestamp
    BEFORE UPDATE ON configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Função para gerar código único de pedido
CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
RETURNS VARCHAR(20) AS $$
DECLARE
    codigo VARCHAR(20);
    existe BOOLEAN;
BEGIN
    LOOP
        codigo := 'DP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM pedidos WHERE codigo_pedido = codigo) INTO existe;
        
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar código do pedido
CREATE OR REPLACE FUNCTION auto_codigo_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_pedido IS NULL OR NEW.codigo_pedido = '' THEN
        NEW.codigo_pedido = gerar_codigo_pedido();
    END IF;
    
    -- Gerar códigos de confirmação
    NEW.codigo_coleta = UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    NEW.codigo_entrega = UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_auto_codigo_pedido
    BEFORE INSERT ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION auto_codigo_pedido();

-- Função para registrar mudanças de status
CREATE OR REPLACE FUNCTION registrar_mudanca_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir no histórico apenas se o status mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pedido_historico (
            pedido_id,
            status_anterior,
            status_novo,
            observacoes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Mudança automática de status'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_mudanca_status
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_mudanca_status();

-- Função para atualizar estatísticas do motoboy
CREATE OR REPLACE FUNCTION atualizar_stats_motoboy()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um pedido é entregue
    IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
        UPDATE motoboys 
        SET 
            total_entregas = total_entregas + 1,
            entregas_concluidas = entregas_concluidas + 1
        WHERE id = NEW.motoboy_id;
    END IF;
    
    -- Quando um pedido é cancelado
    IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
        UPDATE motoboys 
        SET entregas_canceladas = entregas_canceladas + 1
        WHERE id = NEW.motoboy_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_stats_motoboy
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_stats_motoboy();

-- Função para atualizar avaliação média do motoboy
CREATE OR REPLACE FUNCTION atualizar_avaliacao_motoboy()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular média de avaliações
    UPDATE motoboys 
    SET 
        avaliacao_media = (
            SELECT ROUND(AVG(nota_geral), 2)
            FROM avaliacoes 
            WHERE motoboy_id = NEW.motoboy_id
        ),
        total_avaliacoes = (
            SELECT COUNT(*)
            FROM avaliacoes 
            WHERE motoboy_id = NEW.motoboy_id
        )
    WHERE id = NEW.motoboy_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_avaliacao_motoboy
    AFTER INSERT OR UPDATE ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_avaliacao_motoboy();

-- Função para calcular distância entre coordenadas (Haversine)
CREATE OR REPLACE FUNCTION calcular_distancia(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371; -- Raio da Terra em km
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN ROUND((R * c)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- ===== VIEWS PARA RELATÓRIOS =====

-- View para dashboard de motoboys
CREATE OR REPLACE VIEW dashboard_motoboys AS
SELECT 
    m.id,
    m.nome,
    m.email,
    m.telefone,
    m.status,
    m.disponivel,
    m.online,
    m.total_entregas,
    m.entregas_concluidas,
    m.entregas_canceladas,
    m.avaliacao_media,
    m.total_avaliacoes,
    COUNT(p.id) FILTER (WHERE p.data_criacao >= CURRENT_DATE - INTERVAL '30 days') as pedidos_mes_atual,
    COUNT(p.id) FILTER (WHERE p.status = 'em_transito') as pedidos_em_andamento,
    AVG(EXTRACT(EPOCH FROM (p.data_entrega - p.data_coleta))/60) FILTER (WHERE p.data_entrega IS NOT NULL) as tempo_medio_entrega
FROM motoboys m
LEFT JOIN pedidos p ON m.id = p.motoboy_id
GROUP BY m.id, m.nome, m.email, m.telefone, m.status, m.disponivel, m.online, 
         m.total_entregas, m.entregas_concluidas, m.entregas_canceladas, 
         m.avaliacao_media, m.total_avaliacoes;

-- View para relatório de pedidos
CREATE OR REPLACE VIEW relatorio_pedidos AS
SELECT 
    p.id,
    p.codigo_pedido,
    p.status,
    p.urgencia,
    p.valor_entrega,
    p.distancia_km,
    p.data_criacao,
    p.data_entrega,
    u.nome as nome_usuario,
    u.email as email_usuario,
    m.nome as nome_motoboy,
    m.email as email_motoboy,
    CASE 
        WHEN p.data_entrega IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (p.data_entrega - p.data_criacao))/60
        ELSE NULL 
    END as tempo_total_minutos,
    av.nota_geral as avaliacao
FROM pedidos p
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN motoboys m ON p.motoboy_id = m.id
LEFT JOIN avaliacoes av ON p.id = av.pedido_id;

-- ===== DADOS INICIAIS =====

-- Configurações padrão do sistema
INSERT INTO configuracoes (chave, valor, descricao, categoria, criada_por) VALUES
('taxa_base_entrega', '8.00', 'Taxa base para cálculo de entrega (R$)', 'precos', 'sistema'),
('taxa_por_km', '2.50', 'Taxa adicional por quilômetro (R$)', 'precos', 'sistema'),
('taxa_urgencia_expressa', '5.00', 'Taxa adicional para entrega expressa (R$)', 'precos', 'sistema'),
('taxa_urgencia_ultra', '10.00', 'Taxa adicional para entrega ultra rápida (R$)', 'precos', 'sistema'),
('tempo_cancelamento', '300', 'Tempo limite para cancelamento sem taxa (segundos)', 'geral', 'sistema'),
('raio_busca_motoboys', '10', 'Raio de busca por motoboys disponíveis (km)', 'geral', 'sistema'),
('max_tentativas_login', '5', 'Máximo de tentativas de login por hora', 'seguranca', 'sistema'),
('versao_app', '1.0.0', 'Versão atual do aplicativo', 'sistema', 'sistema'),
('taxa_plataforma', '0.10', 'Taxa da plataforma (percentual)', 'precos', 'sistema'),
('tempo_maximo_entrega', '120', 'Tempo máximo para entrega em minutos', 'geral', 'sistema')
ON CONFLICT (chave) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE usuarios IS 'Clientes que solicitam entregas através da plataforma';
COMMENT ON TABLE motoboys IS 'Entregadores cadastrados e verificados na plataforma';
COMMENT ON TABLE pedidos IS 'Solicitações de entrega criadas pelos usuários';
COMMENT ON TABLE pedido_historico IS 'Histórico completo de mudanças de status dos pedidos';
COMMENT ON TABLE avaliacoes IS 'Avaliações dos usuários sobre os serviços dos motoboys';
COMMENT ON TABLE mensagens IS 'Sistema de chat entre usuários, motoboys e suporte';
COMMENT ON TABLE notificacoes IS 'Sistema de notificações push, email e SMS';
COMMENT ON TABLE configuracoes IS 'Configurações dinâmicas do sistema';
COMMENT ON TABLE logs_sistema IS 'Logs detalhados para auditoria e debugging';
COMMENT ON TABLE sessoes IS 'Controle de sessões e autenticação';

-- Log da criação do schema
INSERT INTO logs_sistema (nivel, categoria, modulo, mensagem, contexto) 
VALUES ('INFO', 'database', 'migration', 'Schema DropPoint criado com sucesso', 
        '{"version": "1.0.0", "tables_created": 10, "indexes_created": 30}');

-- Criar usuário admin padrão (senha: admin123)
INSERT INTO usuarios (nome, email, telefone, senha_hash, status, verificado, email_verificado)
VALUES ('Administrador', 'admin@droppoint.com', '(11) 99999-0000', 
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMxtCf8vJ0nE2.K', 
        'ativo', true, true)
ON CONFLICT (email) DO NOTHING;

COMMIT;