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
import { telemetryRoutes } from './modules/telemetry/telemetry.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { teamRoutes } from './modules/team/team.routes.js';

const app = fastify({
  logger: env.NODE_ENV === 'development'
});

async function bootstrap() {
  // ── 1. SEGURANÇA: HELMET ──
  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  // ── 2. SEGURANÇA: CORS DINÂMICO ──
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origin.includes('localhost') || origin.includes('vercel.app') || origin === env.CLIENT_URL) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // ── 3. SEGURANÇA: COOKIES & JWT ──
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'access_token',
      signed: false
    }
  });

  // ── 4. RATE LIMITING ──
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute'
  });

  // ── 5. REGISTRO DE TODOS OS MÓDULOS DE API ──
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(assetRoutes, { prefix: '/api/v1/assets' });
  await app.register(workOrderRoutes, { prefix: '/api/v1/work-orders' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit' });
  await app.register(telemetryRoutes, { prefix: '/api/v1/telemetry' });
  await app.register(inventoryRoutes, { prefix: '/api/v1/inventory' });
  await app.register(teamRoutes, { prefix: '/api/v1/team' });

  // ── 6. TRATAMENTO CENTRALIZADO DE ERROS ──
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: 'Erro de validação nos dados enviados.',
        errors: error.format()
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      message: 'Erro interno do servidor. A equipe de engenharia foi notificada.'
    });
  });

  // ── 7. HEALTHCHECK ──
  app.get('/health', async () => ({ status: 'ok', service: 'PortLog OS Enterprise API', timestamp: new Date() }));

  // ── 8. INICIA O SERVIDOR ──
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 PortLog OS Server Enterprise rodando com sucesso na porta ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
