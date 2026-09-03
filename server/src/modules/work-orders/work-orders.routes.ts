import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

export async function workOrderRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── 1. LISTAR ORDENS DE SERVIÇO COM FILTROS DE SLA & STATUS ──
  app.get('/', async (request, reply) => {
    const querySchema = z.object({
      status: z.enum(['ABERTA', 'EM_TRIAGEM', 'APROVADA', 'EM_EXECUCAO', 'AGUARDANDO_PECA', 'VALIDACAO_QA', 'CONCLUIDA', 'CANCELADA']).optional(),
      priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIAL_BERCO']).optional(),
      type: z.enum(['PREVENTIVA_PROGRAMADA', 'CORRETIVA_URGENTE', 'PREDITIVA_SENSOR', 'INSPECAO_NORMATIVA']).optional(),
      assetId: z.string().uuid().optional(),
      assignedToId: z.string().uuid().optional()
    });

    const filters = querySchema.parse(request.query);
    const { tenantId } = request.user;

    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId,
        ...filters
      },
      orderBy: [
        { priority: 'desc' },
        { slaDeadline: 'asc' }
      ],
      include: {
        asset: { select: { id: true, code: true, name: true, category: true, locationBerth: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { checklists: true, partsUsed: true } }
      }
    });

    return reply.send({ workOrders });
  });

  // ── 2. ABERTURA DE NOVA ORDEM DE SERVIÇO COM CÁLCULO DE SLA ──
  app.post('/', async (request, reply) => {
    const createWOSchema = z.object({
      assetId: z.string().uuid(),
      type: z.enum(['PREVENTIVA_PROGRAMADA', 'CORRETIVA_URGENTE', 'PREDITIVA_SENSOR', 'INSPECAO_NORMATIVA']),
      priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIAL_BERCO']).default('MEDIA'),
      title: z.string().min(5).max(150),
      description: z.string().min(10),
      slaHours: z.number().min(1).max(720).default(24), // Horas para estourar SLA
      assignedToId: z.string().uuid().optional(),
      checklists: z.array(z.string().min(3)).optional()
    });

    const body = createWOSchema.parse(request.body);
    const { tenantId, sub: userId } = request.user;

    // Valida se o ativo pertence ao tenant
    const asset = await prisma.asset.findFirst({
      where: { id: body.assetId, tenantId }
    });

    if (!asset) {
      throw new AppError('Equipamento não encontrado neste terminal.', 404);
    }

    // Calcula deadline do SLA em milissegundos
    const slaDeadline = new Date(Date.now() + body.slaHours * 60 * 60 * 1000);

    const workOrder = await prisma.$transaction(async (tx) => {
      // 1. Gera o próximo número de ordem sequencial do tenant
      const count = await tx.workOrder.count({ where: { tenantId } });
      const nextOrderNumber = 1001 + count;

      // 2. Cria a OS
      const createdWO = await tx.workOrder.create({
        data: {
          tenantId,
          orderNumber: nextOrderNumber,
          assetId: body.assetId,
          type: body.type,
          priority: body.priority,
          title: body.title,
          description: body.description,
          slaDeadline,
          assignedToId: body.assignedToId,
          createdById: userId,
          status: 'ABERTA'
        }
      });

      // 3. Atualiza o status do ativo se for falha crítica/corretiva
      if (body.priority === 'EMERGENCIAL_BERCO' || body.type === 'CORRETIVA_URGENTE') {
        await tx.asset.update({
          where: { id: body.assetId },
          data: { status: 'EM_MANUTENCAO' }
        });
      }

      // 4. Insere checklists padrões se fornecidos
      if (body.checklists && body.checklists.length > 0) {
        await tx.wOChecklist.createMany({
          data: body.checklists.map(item => ({
            workOrderId: createdWO.id,
            taskItem: item
          }))
        });
      }

      // 5. Auditoria
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WO_OPENED',
          entity: 'WorkOrder',
          entityId: createdWO.id,
          details: {
            orderNumber: nextOrderNumber,
            priority: body.priority,
            assetCode: asset.code,
            slaDeadline
          }
        }
      });

      return createdWO;
    });

    return reply.status(201).send({ workOrder });
  });

// ── MÁQUINA DE ESTADOS FINITA (FSM) PARA O KANBAN INDUSTRIAL ──
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ABERTA: ['EM_TRIAGEM', 'CANCELADA'],
  EM_TRIAGEM: ['APROVADA', 'CANCELADA'],
  APROVADA: ['EM_EXECUCAO', 'CANCELADA'],
  EM_EXECUCAO: ['AGUARDANDO_PECA', 'VALIDACAO_QA', 'CANCELADA'],
  AGUARDANDO_PECA: ['EM_EXECUCAO', 'CANCELADA'],
  VALIDACAO_QA: ['CONCLUIDA', 'EM_EXECUCAO', 'CANCELADA'],
  CONCLUIDA: [], // Estado terminal imutável
  CANCELADA: []  // Estado terminal imutável
};

  // ── 3. TRANSIÇÃO DE ESTADOS DA OS COM MÁQUINA DE ESTADOS BLINDADA ──
  app.patch('/:id/status', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      status: z.enum(['ABERTA', 'EM_TRIAGEM', 'APROVADA', 'EM_EXECUCAO', 'AGUARDANDO_PECA', 'VALIDACAO_QA', 'CONCLUIDA', 'CANCELADA']),
      notes: z.string().optional()
    });

    const { id } = paramsSchema.parse(request.params);
    const { status: targetStatus, notes } = bodySchema.parse(request.body);
    const { tenantId, sub: userId, role } = request.user;

    const currentWO = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: { checklists: true }
    });

    if (!currentWO) {
      throw new AppError('Ordem de serviço não encontrada.', 404);
    }

    // 1. Validação Estrita da Máquina de Estados Finita (Impede saltos ilegais)
    const validNextStates = ALLOWED_TRANSITIONS[currentWO.status] || [];
    if (!validNextStates.includes(targetStatus)) {
      throw new AppError(
        `Transição de estado ilegal: não é permitido transicionar a OS diretamente de '${currentWO.status}' para '${targetStatus}'. O fluxo operacional deve respeitar o ciclo de vida do Kanban.`,
        422
      );
    }

    // 2. Validação de Governança RBAC Granular por Ação:
    if (targetStatus === 'CANCELADA') {
      if (!['ADMIN_MASTER', 'SUPERVISOR_OPERACIONAL'].includes(role)) {
        throw new AppError('Apenas Administradores ou Supervisores Operacionais possuem permissão para cancelar Ordens de Serviço.', 403);
      }
    }

    if (targetStatus === 'APROVADA') {
      if (!['ADMIN_MASTER', 'SUPERVISOR_OPERACIONAL'].includes(role)) {
        throw new AppError('Apenas Administradores ou Supervisores Operacionais podem aprovar Ordens de Serviço em triagem.', 403);
      }
    }

    if (targetStatus === 'CONCLUIDA') {
      if (!['ADMIN_MASTER', 'SUPERVISOR_OPERACIONAL', 'AUDITOR_QA'].includes(role)) {
        throw new AppError('Apenas Supervisores ou Auditores de QA podem dar o aceite final e concluir a OS.', 403);
      }

      // Validação de conformidade operacional: 100% dos checklists devem estar validados
      const pendingChecklists = currentWO.checklists.filter(c => !c.completed);
      if (pendingChecklists.length > 0) {
        throw new AppError(`Não é possível concluir. Existem ${pendingChecklists.length} itens pendentes de validação no checklist técnico.`, 400);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const isFinishing = targetStatus === 'CONCLUIDA';
      const isStarting = targetStatus === 'EM_EXECUCAO' && !currentWO.startedAt;

      const wo = await tx.workOrder.update({
        where: { id },
        data: {
          status: targetStatus,
          ...(isStarting && { startedAt: new Date() }),
          ...(isFinishing && { completedAt: new Date() })
        }
      });

      // Se concluiu a OS, restaura o status do ativo para OPERACIONAL
      if (isFinishing) {
        await tx.asset.update({
          where: { id: currentWO.assetId },
          data: {
            status: 'OPERACIONAL',
            lastMaintenanceAt: new Date()
          }
        });
      }

      // Trilha de auditoria
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'WO_STATUS_TRANSITION',
          entity: 'WorkOrder',
          entityId: id,
          ipAddress: request.ip,
          details: {
            from: currentWO.status,
            to: targetStatus,
            notes
          }
        }
      });

      return wo;
    });

    return reply.send({ workOrder: updated });
  });

  // ── 4. APONTAMENTO DE ITEM DE CHECKLIST PELO TÉCNICO DE CAMPO ──
  app.patch('/checklists/:checklistId', async (request, reply) => {
    const paramsSchema = z.object({ checklistId: z.string().uuid() });
    const bodySchema = z.object({
      completed: z.boolean(),
      measuredValue: z.string().max(50).optional(),
      notes: z.string().optional()
    });

    const { checklistId } = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const { tenantId, sub: userId } = request.user;

    const checklist = await prisma.wOChecklist.findFirst({
      where: { id: checklistId, workOrder: { tenantId } }
    });

    if (!checklist) {
      throw new AppError('Item de checklist não encontrado.', 404);
    }

    const updated = await prisma.wOChecklist.update({
      where: { id: checklistId },
      data: {
        completed: body.completed,
        measuredValue: body.measuredValue,
        notes: body.notes,
        checkedAt: body.completed ? new Date() : null
      }
    });

    return reply.send({ checklist: updated });
  });
}
