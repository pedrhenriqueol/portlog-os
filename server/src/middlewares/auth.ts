import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../shared/errors/AppError.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Tenta autenticar por Cookie HttpOnly OU por Bearer Header (para máxima compatibilidade cross-domain)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await request.jwtVerify();
    } else {
      await request.jwtVerify({ onlyCookie: true });
    }
  } catch (err) {
    throw new AppError('Sessão expirada ou não autenticada. Faça login novamente.', 401);
  }
}

export function authorize(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user;
    
    if (!allowedRoles.includes(role)) {
      throw new AppError('Acesso não autorizado para o seu perfil operacional.', 403);
    }
  };
}
