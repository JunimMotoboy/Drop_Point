# DropPoint Backend API

Sistema completo de entregas e delivery com backend Node.js, PostgreSQL e autenticação JWT.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Autenticação](#autenticação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuição](#contribuição)

## 🚀 Características

- ✅ **Autenticação JWT** - Login seguro para usuários e motoboys
- ✅ **Gestão de Usuários** - Perfis, histórico, configurações
- ✅ **Sistema de Motoboys** - Localização, disponibilidade, estatísticas
- ✅ **Gestão de Pedidos** - Criação, rastreamento, status em tempo real
- ✅ **Sistema de Avaliações** - Reviews, ratings e feedback
- ✅ **Chat Integrado** - Mensagens entre usuários e motoboys
- ✅ **Notificações** - Sistema completo de notificações push
- ✅ **Rate Limiting** - Proteção contra spam e ataques
- ✅ **CORS Configurado** - Integração com frontend
- ✅ **Logs Detalhados** - Monitoramento e debugging
- ✅ **Validação Robusta** - Sanitização de dados

## 🛠 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados principal
- **Neon DB** - Banco PostgreSQL em nuvem
- **JWT** - Autenticação por tokens
- **bcryptjs** - Hash de senhas
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-Origin Resource Sharing

## 📦 Instalação

### Pré-requisitos

- Node.js 16+ instalado
- Conta no [Neon DB](https://neon.tech) (ou PostgreSQL local)
- Git

### Clone o repositório

```bash
git clone <url-do-repositorio>
cd Drop_Point/backend
```

### Instale as dependências

```bash
npm install
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie o arquivo `.env` na pasta `backend`:

```env
# Configuração do Servidor
NODE_ENV=development
PORT=3000

# Configuração do Banco de Dados (Neon DB)
# Para ambientes com SSL habilitado (produção)
DATABASE_URL=postgresql://usuario:senha@endpoint.pooler.neon.tech/database?sslmode=require

# Para ambientes institucionais com SSL desabilitado
DATABASE_HOST=endpoint.pooler.neon.tech
DATABASE_PORT=5432
DATABASE_NAME=database
DATABASE_USER=usuario
DATABASE_PASSWORD=senha
DATABASE_SSL=false

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Upload de Arquivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Entrega
TAXA_BASE_ENTREGA=5.00
TAXA_POR_KM=2.50
TEMPO_BASE_ENTREGA=30
TEMPO_POR_KM=5
```

### 2. Configuração do Banco de Dados

#### Opção A: Neon DB (Recomendado)

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie as credenciais de conexão
5. Configure no `.env` conforme mostrado acima

#### Opção B: PostgreSQL Local

```bash
# Instalar PostgreSQL
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows - baixar do site oficial
```

Configurar no `.env`:
```env
DATABASE_URL=postgresql://postgres:senha@localhost:5432/droppoint
```

### 3. Criar Estrutura do Banco

Execute o script de criação das tabelas:

```bash
# Via npm script
npm run setup-db

# Ou manualmente com psql
psql -h endpoint.pooler.neon.tech -U usuario -d database -f scripts/create_tables.sql
```

## 🚀 Execução

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ou
npm start
```

### Produção

```bash
# Instalar dependências de produção
npm ci --only=production

# Iniciar servidor
NODE_ENV=production npm start
```

### Scripts Disponíveis

```bash
npm start          # Iniciar servidor
npm run dev        # Desenvolvimento com nodemon
npm run setup-db   # Criar tabelas do banco
npm run test-db    # Testar conexão com banco
npm run logs       # Ver logs do sistema
```

## 📚 API Endpoints

### Base URL: `http://localhost:3000/api`

### 🔐 Autenticação

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| POST | `/auth/login/usuario` | Login de usuário | `{ email, senha }` |
| POST | `/auth/login/motoboy` | Login de motoboy | `{ email, senha }` |
| POST | `/auth/register/usuario` | Cadastro de usuário | `{ nome, email, senha, telefone, endereco }` |
| POST | `/auth/register/motoboy` | Cadastro de motoboy | `{ nome, email, senha, telefone, veiculo }` |
| POST | `/auth/refresh` | Renovar token | `{ refresh_token }` |
| POST | `/auth/logout` | Logout | - |

### 👤 Usuários

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/usuarios/profile` | Perfil do usuário | ✅ |
| PUT | `/usuarios/profile` | Atualizar perfil | ✅ |
| GET | `/usuarios/pedidos` | Histórico de pedidos | ✅ |
| GET | `/usuarios/dashboard` | Dashboard com estatísticas | ✅ |
| DELETE | `/usuarios/account` | Excluir conta | ✅ |

### 🏍 Motoboys

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/motoboys/profile` | Perfil do motoboy | ✅ |
| PUT | `/motoboys/profile` | Atualizar perfil | ✅ |
| PUT | `/motoboys/location` | Atualizar localização | ✅ |
| PATCH | `/motoboys/disponibilidade` | Alterar disponibilidade | ✅ |
| GET | `/motoboys/pedidos` | Pedidos do motoboy | ✅ |
| GET | `/motoboys/available` | Motoboys disponíveis | ✅ |
| GET | `/motoboys/dashboard` | Dashboard com estatísticas | ✅ |

### 📦 Pedidos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/pedidos` | Criar pedido | ✅ |
| GET | `/pedidos` | Listar pedidos | ✅ |
| GET | `/pedidos/:id` | Detalhes do pedido | ✅ |
| PUT | `/pedidos/:id/status` | Atualizar status | ✅ |
| POST | `/pedidos/:id/aceitar` | Aceitar pedido (motoboy) | ✅ |
| POST | `/pedidos/:id/cancelar` | Cancelar pedido | ✅ |
| GET | `/pedidos/:id/track` | Rastrear pedido | ✅ |
| POST | `/pedidos/calcular-preco` | Calcular preço | ✅ |

### ⭐ Avaliações

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/avaliacoes` | Criar avaliação | ✅ |
| GET | `/avaliacoes/minhas` | Minhas avaliações | ✅ |
| GET | `/avaliacoes/motoboy/:id` | Avaliações do motoboy | ✅ |
| POST | `/avaliacoes/:id/reportar` | Reportar avaliação | ✅ |
| GET | `/avaliacoes/stats/geral` | Estatísticas gerais | ✅ |

### 💬 Mensagens

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/mensagens` | Enviar mensagem | ✅ |
| GET | `/mensagens/pedido/:id` | Mensagens do pedido | ✅ |
| GET | `/mensagens/conversas` | Listar conversas | ✅ |
| PATCH | `/mensagens/:id/marcar-lida` | Marcar como lida | ✅ |
| GET | `/mensagens/nao-lidas/contador` | Contador não lidas | ✅ |
| GET | `/mensagens/buscar` | Buscar mensagens | ✅ |

### 🔔 Notificações

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/notificacoes` | Criar notificação | ✅ |
| GET | `/notificacoes` | Listar notificações | ✅ |
| PATCH | `/notificacoes/:id/marcar-lida` | Marcar como lida | ✅ |
| PATCH | `/notificacoes/marcar-todas-lidas` | Marcar todas lidas | ✅ |
| DELETE | `/notificacoes/:id` | Excluir notificação | ✅ |
| GET | `/notificacoes/nao-lidas/contador` | Contador não lidas | ✅ |
| GET | `/notificacoes/configuracoes` | Configurações | ✅ |
| PATCH | `/notificacoes/configuracoes` | Atualizar configurações | ✅ |

### ❤️ Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do sistema |
| GET | `/` | Documentação da API |

## 🗃 Banco de Dados

### Estrutura Principal

```sql
usuarios
├── id (PK)
├── nome
├── email (UNIQUE)
├── senha_hash
├── telefone
├── endereco (JSONB)
├── avatar_url
├── ativo
├── configuracoes_notificacao (JSONB)
├── data_criacao
└── data_atualizacao

motoboys
├── id (PK)
├── nome
├── email (UNIQUE)
├── senha_hash
├── telefone
├── veiculo (JSONB)
├── localizacao_atual (POINT)
├── disponivel
├── avatar_url
├── documentos (JSONB)
├── nota_media
├── total_entregas
├── configuracoes_notificacao (JSONB)
├── data_criacao
└── data_atualizacao

pedidos
├── id (PK)
├── codigo_pedido (UNIQUE)
├── usuario_id (FK)
├── motoboy_id (FK)
├── endereco_coleta (JSONB)
├── endereco_entrega (JSONB)
├── tipo_objeto
├── descricao
├── valor_objeto
├── preco_entrega
├── distancia_km
├── tempo_estimado_minutos
├── status
├── data_criacao
├── data_aceite
├── data_coleta
├── data_entrega
├── observacoes
└── localizacao_atual (POINT)
```

### Relacionamentos

- `pedidos.usuario_id` → `usuarios.id`
- `pedidos.motoboy_id` → `motoboys.id`
- `avaliacoes.pedido_id` → `pedidos.id`
- `mensagens.pedido_id` → `pedidos.id`
- `notificacoes.usuario_id` → `usuarios.id`
- `notificacoes.motoboy_id` → `motoboys.id`

## 🔒 Autenticação

### JWT Token Structure

```json
{
  "id": 123,
  "type": "usuario|motoboy",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Headers Necessários

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Middleware de Autenticação

Todas as rotas protegidas requerem:

1. Header `Authorization` com Bearer token
2. Token JWT válido e não expirado
3. Usuário ativo no sistema

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração do banco
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticação
│   ├── routes/
│   │   ├── auth.js              # Rotas de autenticação
│   │   ├── usuarios.js          # Rotas de usuários
│   │   ├── motoboys.js          # Rotas de motoboys
│   │   ├── pedidos.js           # Rotas de pedidos
│   │   ├── avaliacoes.js        # Rotas de avaliações
│   │   ├── mensagens.js         # Rotas de mensagens
│   │   └── notificacoes.js      # Rotas de notificações
│   └── app.js                   # Aplicação principal
├── scripts/
│   └── create_tables.sql        # Script de criação das tabelas
├── uploads/                     # Arquivos uploadados
├── package.json                 # Dependências e scripts
├── .env                         # Variáveis de ambiente
└── README.md                    # Esta documentação
```

## 🔧 Configurações Avançadas

### Rate Limiting

O sistema possui proteção contra spam:

- **Window**: 15 minutos
- **Max Requests**: 100 por IP
- **Headers**: `X-RateLimit-*`

### CORS

Origens permitidas por padrão:
- `http://localhost:3000`
- `http://127.0.0.1:5500`
- `http://localhost:5500`
- `file://` (para desenvolvimento local)

### Upload de Arquivos

- **Tamanho máximo**: 10MB
- **Pasta**: `./uploads`
- **Tipos permitidos**: Configurável por endpoint

### Logs do Sistema

Os logs são salvos na tabela `logs_sistema`:

```sql
SELECT * FROM logs_sistema 
WHERE categoria = 'auth' 
ORDER BY timestamp DESC 
LIMIT 10;
```

## 🚨 Tratamento de Erros

### Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Sem permissão
- `404` - Não encontrado
- `429` - Muitas requisições
- `500` - Erro interno

### Formato de Erro

```json
{
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": {}
}
```

## 🧪 Testes

### Testar Conexão com Banco

```bash
npm run test-db
```

### Endpoints de Teste

```bash
# Health check
curl http://localhost:3000/api/health

# Documentação
curl http://localhost:3000/api

# Login
curl -X POST http://localhost:3000/api/auth/login/usuario \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","senha":"123456"}'
```

## 📈 Monitoramento

### Métricas Disponíveis

- Status do banco de dados
- Uptime do servidor
- Uso de memória
- Logs de sistema
- Rate limiting

### Health Check

```bash
curl http://localhost:3000/api/health
```

Retorna:
```json
{
  "status": "OK",
  "database": "connected",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 30000000,
    "heapUsed": 20000000
  }
}
```

## 🔄 Deploy

### Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Criar app
heroku create droppoint-api

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=sua_url_do_banco

# Deploy
git push heroku main
```

### Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway deploy
```

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=chave_super_secreta_producao
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🤝 Contribuição

### Padrões de Código

- **ESLint**: Linting automático
- **Prettier**: Formatação de código
- **Commits**: Conventional Commits

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Reportar Bugs

Use as [Issues do GitHub](link-para-issues) com:

- Descrição detalhada
- Passos para reproduzir
- Logs de erro
- Versão do sistema

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@droppoint.com
- **Discord**: [Discord Server](link-discord)
- **Documentação**: [docs.droppoint.com](link-docs)

---

**DropPoint Backend** - Sistema completo de entregas e delivery 🚀

Desenvolvido com ❤️ para facilitar entregas rápidas e seguras.