import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres para segurança'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET deve ter pelo menos 32 caracteres'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().default('localhost')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:', _env.error.format());
  throw new Error('Falha crítica nas variáveis de ambiente.');
}

export const env = _env.data;
