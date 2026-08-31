import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { env } from '../../config/env.js';
import { authenticate } from '../../middlewares/auth.js';

export async function authRoutes(app: FastifyInstance) {
  
  // ── 1. REGISTRO INICIAL DE TENANT + ADMIN MASTER ──
  app.post('/register-tenant', async (request, reply) => {
    const registerSchema = z.object({
      tenantName: z.string().min(3).max(120),
      tenantSlug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas e hífens'),
      cnpj: z.string().min(14).max(18),
      adminName: z.string().min(3).max(100),
      email: z.string().email(),
      password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres')
    });

    const body = registerSchema.parse(request.body);

    const existingSlug = await prisma.tenant.findUnique({ where: { slug: body.tenantSlug } });
    if (existingSlug) {
      throw new AppError('Este slug de terminal já está em uso.', 409);
    }

    const existingCnpj = await prisma.tenant.findUnique({ where: { cnpj: body.cnpj } });
    if (existingCnpj) {
      throw new AppError('CNPJ já cadastrado na plataforma.', 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.tenantName,
          slug: body.tenantSlug,
          cnpj: body.cnpj
        }
      });

      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: body.adminName,
          email: body.email.toLowerCase(),
          passwordHash,
          role: 'ADMIN_MASTER'
        }
      });

      return { tenant, adminUser };
    });

    return reply.status(201).send({
      message: 'Terminal portuário e conta mestre criados com sucesso.',
      tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug }
    });
  });

  // ── 2. LOGIN COM COOKIE HTTPONLY SEGURO ──
  app.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      tenantSlug: z.string(),
      email: z.string().email(),
      password: z.string()
    });

    const { tenantSlug, email, password } = loginSchema.parse(request.body);

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.active) {
      throw new AppError('Terminal não encontrado ou inativo.', 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: email.toLowerCase()
        }
      }
    });

    if (!user || !user.active) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    // Assina o token JWT no server
    const token = await reply.jwtSign(
      { tenantId: tenant.id, role: user.role },
      { sub: user.id, expiresIn: env.JWT_EXPIRES_IN }
    );

    // Salva o token em cookie HttpOnly com flags estritas de segurança
    reply.setCookie('access_token', token, {
      path: '/',
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 1 dia
    });

    return reply.send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug }
      }
    });
  });

  // ── 3. ME (RETORNA DADOS DO USUÁRIO LOGADO) ──
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      include: { tenant: { select: { id: true, name: true, slug: true } } }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return reply.send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant
      }
    });
  });

  // ── 4. LOGOUT SEGURO (LIMPA COOKIE) ──
  app.post('/logout', async (request, reply) => {
    reply.clearCookie('access_token', { path: '/' });
    return reply.send({ message: 'Logout efetuado com sucesso.' });
  });
}
