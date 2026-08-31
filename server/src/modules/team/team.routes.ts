import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

export async function teamRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── 1. LISTAR MEMBROS DA EQUIPE TÉCNICA DO TERMINAL ──
  app.get('/', async (request, reply) => {
    const { tenantId } = request.user;

    const team = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            assignedWOs: { where: { status: { in: ['EM_EXECUCAO', 'AGUARDANDO_PECA', 'VALIDACAO_QA'] } } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return reply.send({ team });
  });

  // ── 2. CADASTRAR NOVO TÉCNICO / AUDITOR QA NO TERMINAL ──
  app.post(
    '/',
    { preHandler: [authorize(['ADMIN_MASTER', 'SUPERVISOR_OPERACIONAL'])] },
    async (request, reply) => {
      const createMemberSchema = z.object({
        name: z.string().min(3).max(100),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['SUPERVISOR_OPERACIONAL', 'TECNICO_MANUTENCAO', 'AUDITOR_QA'])
      });

      const body = createMemberSchema.parse(request.body);
      const { tenantId, sub: userId } = request.user;

      const existingUser = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email: body.email.toLowerCase() } }
      });

      if (existingUser) {
        throw new AppError('Este e-mail já está cadastrado neste terminal.', 409);
      }

      const passwordHash = await bcrypt.hash(body.password, 12);

      const member = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            tenantId,
            name: body.name,
            email: body.email.toLowerCase(),
            passwordHash,
            role: body.role
          },
          select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'TEAM_MEMBER_CREATED',
            entity: 'User',
            entityId: created.id,
            details: { name: created.name, role: created.role, email: created.email }
          }
        });

        return created;
      });

      return reply.status(201).send({ member });
    }
  );
}
