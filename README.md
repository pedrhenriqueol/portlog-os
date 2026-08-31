# ⚓ PortLog OS — Enterprise Port Asset & Maintenance Management

> SaaS B2B Fullstack corporativo para Gestão de Ordens de Serviço (OS), Manutenção Preditiva/Corretiva e Controle de SLA para Equipamentos Portuários e Terminais Logísticos.

---

## 🛡️ Arquitetura & Segurança por Design

* **Multi-Tenant com Isolamento Lógico Estrito**: Todas as consultas e operações são isoladas por `tenantId` extraído da sessão autenticada.
* **Autenticação Segura**: JWT assinado no servidor e trafegado exclusivamente via cookies `HttpOnly`, `SameSite=Strict` e `Secure` (zero tokens no `localStorage`).
* **RBAC Server-Enforced**: Controle granular de acesso baseado em papéis (`ADMIN_MASTER`, `SUPERVISOR_OPERACIONAL`, `TECNICO_MANUTENCAO`, `AUDITOR_QA`).
* **Trilha de Auditoria Imutável**: Logs de conformidade técnica e regulatória para alterações de status de OS e equipamentos.
* **Validação Estrita de Schemas**: DTOs com validação via `Zod` prevenindo *Parameter Pollution* e *SQL Injection*.
* **Rate Limiting & Helmet**: Proteção contra ataques de força bruta, DoS e cabeçalhos HTTP seguros.

---

## 🛠️ Stack Tecnológica

### Back-end (`/server`)
* **Runtime & Framework**: Node.js + Fastify + TypeScript
* **Database & ORM**: PostgreSQL + Prisma ORM
* **Segurança & Criptografia**: `@fastify/jwt`, `@fastify/cookie`, `@fastify/helmet`, `bcryptjs`, `zod`
* **Build & Dev**: `tsx`, `tsup`

### Front-end (`/client`) *(Em estruturação)*
* **Framework**: React 18/19 + TypeScript + Vite
* **Estilização & UI**: Tailwind CSS + Lucide Icons + Framer Motion
* **Gerenciamento de Estado**: TanStack Query (React Query) + Zustand

---

## 🚀 Como Executar o Back-end Localmente

1. Navegue até a pasta do servidor:
   ```bash
   cd server
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env`:
   ```bash
   cp .env.example .env
   ```

4. Gere o client do Prisma e execute as migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
