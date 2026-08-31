import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';

export async function inventoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── 1. LISTAR PEÇAS UTILIZADAS E HISTÓRICO DE CUSTOS DE UMA OS ──
  app.get('/work-orders/:workOrderId/parts', async (request, reply) => {
    const paramsSchema = z.object({ workOrderId: z.string().uuid() });
    const { workOrderId } = paramsSchema.parse(request.params);
    const { tenantId } = request.user;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId }
    });

    if (!workOrder) {
      throw new AppError('Ordem de serviço não encontrada.', 404);
    }

    const parts = await prisma.wOPart.findMany({
      where: { workOrderId },
      orderBy: { partName: 'asc' }
    });

    return reply.send({ parts });
  });

  // ── 2. APONTAR PEÇA / COMPONENTE CONSUMIDO NA OS COM RECALCULO DE CUSTO ──
  app.post('/work-orders/:workOrderId/parts', async (request, reply) => {
    const paramsSchema = z.object({ workOrderId: z.string().uuid() });
    const bodySchema = z.object({
      partName: z.string().min(2).max(120),
      partCode: z.string().min(2).max(50),
      quantity: z.number().int().min(1).default(1),
      unitCost: z.number().min(0)
    });

    const { workOrderId } = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const { tenantId, sub: userId } = request.user;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId }
    });

    if (!workOrder) {
      throw new AppError('Ordem de serviço não encontrada.', 404);
    }

    const totalCost = Number((body.quantity * body.unitCost).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria o registro da peça
      const createdPart = await tx.wOPart.create({
        data: {
          workOrderId,
          partName: body.partName,
          partCode: body.partCode,
          quantity: body.quantity,
          unitCost: body.unitCost,
          totalCost
        }
      });

      // 2. Atualiza o custo acumulado de peças na OS
      const allParts = await tx.wOPart.findMany({ where: { workOrderId } });
      const accumulatedPartsCost = allParts.reduce((acc, p) => acc + Number(p.totalCost), 0);

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { costParts: accumulatedPartsCost }
      });

      // 3. Auditoria
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'PART_ATTACHED_TO_WO',
          entity: 'WOPart',
          entityId: createdPart.id,
          details: {
            partName: body.partName,
            quantity: body.quantity,
            totalCost,
            orderNumber: workOrder.orderNumber
          }
        }
      });

      return createdPart;
    });

    return reply.status(201).send({ part: result });
  });
}
