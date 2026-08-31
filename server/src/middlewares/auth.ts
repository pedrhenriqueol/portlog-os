import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../shared/errors/AppError.js';

export interface UserPayload {
  sub: string;      // userId (UUID)
  tenantId: string; // tenantId (UUID)
  role: 'ADMIN_MASTER' | 'SUPERVISOR_OPERACIONAL' | 'TECNICO_MANUTENCAO' | 'AUDITOR_QA';
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload;
  }
}

/**
 * Middleware que intercepta o token JWT do cookie seguro HttpOnly ou Bearer header
 * e anexa as credenciais e o tenantId exclusivamente validados pelo servidor.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Tenta ler do cookie assinado HttpOnly ou fallback para Header
    const token = request.cookies.access_token || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Não autenticado. Token de acesso ausente.', 401);
    }

    const decoded = await request.jwtVerify<UserPayload>();
    request.user = decoded;
  } catch (err) {
    throw new AppError('Sessão expirada ou token inválido.', 401);
  }
}

/**
 * Middleware RBAC Server-Side: Valida se a role do usuário no token
 * possui permissão estrita para executar a operação.
 */
export function authorize(allowedRoles: Array<UserPayload['role']>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AppError(
        `Acesso negado. Seu perfil (${request.user.role}) não possui permissão para esta ação.`,
        403
      );
    }
  };
}
