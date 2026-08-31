import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // Apenas Admin Master ou Auditor de QA podem auditar a trilha do sistema
  app.get('/', { preHandler: [authorize(['ADMIN_MASTER', 'AUDITOR_QA'])] }, async (request, reply) => {
    const querySchema = z.object({
      entity: z.string().optional(),
      action: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(50)
    });

    const { entity, action, limit } = querySchema.parse(request.query);
    const { tenantId } = request.user;

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(entity && { entity }),
        ...(action && { action })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return reply.send({ logs });
  });
}
