# PortLog OS ── Terminal Portuário & Mission Control Industrial

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](LICENSE)

Plataforma SaaS multi-tenant para orquestração de manutenção preditiva, telemetria de sensores IoT de berço (temperatura, vibração e pressão hidráulica) e ciclo de vida de Ordens de Serviço sob conformidade estrita de SLA.

Projetado para operar em ambientes portuários de alta criticidade e tráfego contínuo (24/7), o PortLog OS isola dados operacionais por autoridade portuária via PostgreSQL, processa anomalias de sensores com abertura automática de OS preditivas e mantém uma trilha de auditoria append-only para conformidade normativa de QA.

---

## 1. Arquitetura do Sistema & Fluxo de Telemetria

O pipeline de dados captura leituras de sensores em campo, avalia limiares operacionais e transiciona Ordens de Serviço com auditoria em tempo real.

```mermaid
sequenceDiagram
    autonumber
    actor Sensor as Sensores IoT de Berço
    participant Gateway as PortLog Ingestion API (Fastify)
    participant Engine as Motor de Análise Preditiva
    participant DB as PostgreSQL (Supabase Scoped)
    participant Kanban as Work Order Engine (SLA State Machine)
    participant Audit as Append-Only Audit Trail (QA)
    participant Client as Mission Control Console (React)

    Sensor->>Gateway: GET /api/v1/telemetry/live (Stream de Telemetria: Temp, Vib, Pressão)
    Gateway->>Engine: Processa leituras contra limiares nominais (ex: Temp > 80°C, Vib > 7.0mm/s)
    
    alt Anomalia Detectada / Disparo Manual
        Sensor->>Gateway: POST /api/v1/telemetry/trigger-anomaly (Estresse Preditivo)
        Gateway->>DB: Atualiza status do ativo para EM_MANUTENCAO
        Gateway->>Kanban: Cria Ordem de Serviço (tipo PREDITIVA_SENSOR / prioridade EMERGENCIAL_BERCO)
        Kanban->>DB: Vincula Checklist Técnico e calcula SLA Deadline (D+0)
        Gateway->>Audit: Registra evento IOT_PREDICTIVE_WO_TRIGGERED
        Audit->>DB: Grava log imutável com carimbo UTC
    end

    Client->>Gateway: PATCH /api/v1/work-orders/:id/status (Transição Kanban)
    Gateway->>Kanban: Valida máquina de estados e restrições RBAC
    Kanban->>DB: Atualiza status da OS (EM_EXECUCAO / AGUARDANDO_PECA / VALIDACAO_QA / CONCLUIDA)
    Gateway->>Audit: Registra ação WO_STATUS_CHANGED com usuário e timestamp
    Gateway-->>Client: 200 OK (OS Atualizada & Métricas Sincronizadas)
```

### 1.1. Isolamento Multi-Tenant & Governança (RBAC)
* **Isolamento de Dados por Tenant:** Cada autoridade portuária opera sob um `tenantId` exclusivo. Nenhuma consulta de ativos, ordens de serviço ou registros de auditoria cruza fronteiras entre terminais.
* **Controle de Acesso Baseado em Papéis (RBAC):**
  * `ADMIN_MASTER`: Gestão de terminais, parametrização de infraestrutura e governança total.
  * `SUPERVISOR_OPERACIONAL`: Abertura e triagem de OS, alocação de técnicos e monitoramento de SLA.
  * `TECNICO_MANUTENCAO`: Execução em campo, apontamento de horímetro, preenchimento de checklists e requisição de peças.
  * `AUDITOR_QA`: Validação de conformidade técnica e aceite final para encerramento de ordens de serviço.

---

## 2. Capacidades de Engenharia & Regras de Negócio

### ▪ Telemetria de Ativos Críticos em Tempo Real
* **Frotas Portuárias Monitoradas:** Guindastes Ship-to-Shore (STS Super Post-Panamax), Guindastes RTG de Pátio, Reach Stackers de 45T, Terminal Tractors e Rebocadores Marítimos.
* **Monitoramento Multi-Variável:**
  * **Temperatura de Redutores:** Limiar de alerta em 68°C e crítico em 80°C.
  * **Vibração Mecânica de Mancais:** Limiar de alerta em 4.5 mm/s e crítico em 7.0 mm/s.
  * **Pressão de Linha Hidráulica:** Supervisão de pressão de circuito até 250 bar.

### ▪ Workflow & Kanban de Manutenção Industrial
* **Máquina de Estados Finita:**
  $$\text{ABERTA / TRIAGEM} \longrightarrow \text{EM EXECUÇÃO} \rightleftarrows \text{AGUARDANDO PEÇA} \longrightarrow \text{VALIDAÇÃO QA} \longrightarrow \text{CONCLUÍDA}$$
* **Controle Estrito de SLA:** Cálculo determinístico de prazos contratuais de atendimento (MTTR) com timers visuais de contagem regressiva e alertas de estouro operacional.
* **Auditoria de Encerramento:** Ordens de serviço não podem ser encerradas (`CONCLUIDA`) caso existam itens pendentes no checklist técnico ou caso a validação não tenha sido assinada por um Auditor de QA ou Supervisor.

### ▪ Append-Only Audit Trail
* Trilha de auditoria assíncrona, não mutável e à prova de adulteração.
* Todos os comandos de máquina, transições de status e intervenções em equipamentos são gravados com ID do operador, IP de origem, timestamp ISO 8601 e payload estruturado em JSONB.

### ▪ Console Mission Control (Frontend)
* Interface construída em React 18, Vite e Tailwind CSS, adotando a paleta industrial **Deep Steel Navy** (`#0A0E17`), superfícies metálicas em Slate (`#131B2E`), tipografia monospaçada técnica e Skeleton Loaders anti-glitch para zero flicker durante revalidação.

---

## 3. Matriz de Rotas & Contratos de API

Prefixo corporativo: `/api/v1` (Fastify).

| Método | Endpoint | Autenticação | Descrição Técnica |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register-terminal` | Pública | Provisiona nova autoridade portuária (`Tenant`) e cria o usuário master inicial. |
| `POST` | `/api/v1/auth/login` | Pública | Autentica via `terminalSlug`, `email` e `password`, retornando JWT e cookie de sessão. |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Retorna o perfil do usuário logado, permissões RBAC e metadados do terminal. |
| `GET` | `/api/v1/dashboard/metrics` | Bearer JWT | Consolida KPIs: disponibilidade geral de frota, berços em emergência, MTTR e estouros de SLA. |
| `GET` | `/api/v1/assets` | Bearer JWT | Consulta inventário de equipamentos do terminal com filtros por categoria e busca por código. |
| `POST` | `/api/v1/assets` | Bearer JWT | Cadastra novo ativo portuário com código patrimonial (`STS-01`), berço e horímetro inicial. |
| `GET` | `/api/v1/work-orders` | Bearer JWT | Retorna ledger de ordens de serviço com checklists, peças utilizadas e técnicos designados. |
| `POST` | `/api/v1/work-orders` | Bearer JWT | Abre nova Ordem de Serviço com prioridade, tipo, prazo de SLA e checklist vinculado. |
| `PATCH` | `/api/v1/work-orders/:id/status` | Bearer JWT | Executa transição de fase no Kanban (`EM_EXECUCAO`, `AGUARDANDO_PECA`, `VALIDACAO_QA`, `CONCLUIDA`). |
| `PATCH` | `/api/v1/work-orders/checklists/:id` | Bearer JWT | Marca item de checklist técnico como validado/inspecionado. |
| `GET` | `/api/v1/telemetry/live` | Bearer JWT | Stream snapshot em tempo real de temperatura, vibração e pressão de todos os equipamentos. |
| `POST` | `/api/v1/telemetry/trigger-anomaly` | Bearer JWT | Injeta estresse térmico/mecânico simulado e dispara automaticamente uma OS preditiva no Kanban. |
| `GET` | `/api/v1/team` | Bearer JWT | Lista a equipe técnica e operadores com contagem de OS em atendimento. |
| `POST` | `/api/v1/team` | Bearer JWT | Cadastra novo técnico, supervisor ou auditor de conformidade QA. |
| `GET` | `/api/v1/audit/logs` | Bearer JWT | Consulta trilha de auditoria append-only com histórico de eventos e transições de estado. |

---

## 4. Setup & Execução Local

### 4.1. Pré-requisitos
* Node.js 18.x ou 20.x LTS
* npm ou pnpm
* Instância PostgreSQL (local ou Supabase)

### 4.2. Estrutura do Repositório
```
portlog-os/
├── client/                 # Console Mission Control Industrial (React + Vite + Tailwind)
│   ├── public/             # Favicon SVG marítimo e manifestos
│   ├── src/
│   │   ├── api/            # Cliente Axios com injeção de JWT e normalização de baseURL
│   │   ├── components/     # Modais de OS, Equipamentos, Equipe e Layout Industrial
│   │   ├── context/        # AuthContext com persistência de sessão
│   │   └── pages/          # Dashboard, Telemetry, WorkOrders, Assets, Team, Audit
│   └── package.json
├── server/                 # API Gateway & Engine Preditivo (Fastify + Prisma)
│   ├── prisma/             # Schema relacional, enums e seeds
│   ├── src/
│   │   ├── config/         # Validação Zod de variáveis de ambiente
│   │   ├── middlewares/    # Validação de JWT e RBAC
│   │   ├── modules/        # Domínios: auth, assets, work-orders, dashboard, telemetry, team, audit
│   │   └── server.ts       # Inicialização do Fastify e injeção de plugins de segurança
│   └── package.json
└── README.md
```

### 4.3. Configuração de Variáveis de Ambiente

Crie o arquivo `server/.env`:
```env
# Porta de escuta do servidor Fastify
PORT=3333

# String de conexão com o PostgreSQL (Supabase / Postgres com Transaction Pooler)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Conexão direta para migrações do Prisma (Opcional)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Segredo criptográfico para emissão e validação de tokens JWT (HS256)
JWT_SECRET="portlog-enterprise-mission-control-jwt-secret-key-2026!"

# URL do cliente para validação de CORS
CLIENT_URL="http://localhost:5173"

# Ambiente de execução
NODE_ENV="development"
```

Crie o arquivo `client/.env` (opcional em desenvolvimento, fallback para `localhost:3333/api/v1`):
```env
# URL base do back-end Fastify
VITE_API_URL="http://localhost:3333/api/v1"
```

### 4.4. Inicialização Passo a Passo

1. **Instalar dependências:**
   ```bash
   # No diretório do servidor
   cd server
   npm install

   # No diretório do front-end
   cd ../client
   npm install
   ```

2. **Provisionar banco de dados:**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

3. **Popular banco com dados de demonstração (Seed Industrial):**
   ```bash
   npm run seed
   ```

4. **Inicializar os serviços:**
   ```bash
   # Terminal 1: Back-end API (Fastify)
   cd server
   npm run dev

   # Terminal 2: Front-end Mission Control (Vite)
   cd client
   npm run dev
   ```

5. **Acesso aos serviços:**
   * **Console Mission Control:** `http://localhost:5173` (ou `https://portlog-os.vercel.app`)
   * **API Gateway:** `http://localhost:3333`
   * **Credenciais de Demonstração (Seed Mock):**
     * Terminal Slug: `terminal-santos`
     * E-mail: `admin@terminal.com`
     * Senha: `terminal_demo_2026!`

---

## 5. Licença

Este projeto é distribuído sob os termos da licença [MIT](LICENSE).
