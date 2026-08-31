import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { AppError } from './shared/errors/AppError.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { assetRoutes } from './modules/assets/assets.routes.js';
import { workOrderRoutes } from './modules/work-orders/work-orders.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';

const app = fastify({
  logger: env.NODE_ENV === 'development'
});

// ── 1. SEGURANÇA: HELMET (CABECALHOS HTTP SEGUROS) ──
await app.register(helmet, {
  contentSecurityPolicy: env.NODE_ENV === 'production'
});

// ── 2. SEGURANÇA: CORS RESTRITO ──
await app.register(cors, {
  origin: [env.CLIENT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// ── 3. SEGURANÇA: COOKIES & JWT COM ASSINATURA NO SERVER ──
await app.register(cookie);
await app.register(jwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'access_token',
    signed: false
  }
});

// ── 4. SEGURANÇA: RATE LIMITING (ANTI BRUTE-FORCE / DOS) ──
await app.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute'
});

// ── 5. REGISTRO DE MÓDULOS DE API ──
await app.register(authRoutes, { prefix: '/api/v1/auth' });
await app.register(assetRoutes, { prefix: '/api/v1/assets' });
await app.register(workOrderRoutes, { prefix: '/api/v1/work-orders' });
await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
await app.register(auditRoutes, { prefix: '/api/v1/audit' });

// ── 6. TRATAMENTO CENTRALIZADO DE ERROS (ZERO LEAK DE STACK TRACE EM PROD) ──
app.setErrorHandler((error, request, reply) => {
  // Erros de validação Zod (Payloads inválidos)
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Erro de validação nos dados enviados.',
      errors: error.format()
    });
  }

  // Erros operacionais conhecidos (AppError)
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message
    });
  }

  // Log interno para diagnóstico de QA/Dev
  request.log.error(error);

  // Resposta genérica segura para o cliente (nunca expor SQL/internals)
  return reply.status(500).send({
    message: 'Erro interno do servidor. A equipe de engenharia foi notificada.'
  });
});

// ── 7. HEALTHCHECK ──
app.get('/health', async () => ({ status: 'ok', service: 'PortLog OS API', timestamp: new Date() }));

// ── 8. BOOTSTRAP ──
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 PortLog OS Server rodando com sucesso na porta ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
