import { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/prisma.js';
import { authenticate } from '../../middlewares/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── MÉTRICAS EXECUTIVAS DE SLA, DISPONIBILIDADE & MTTR ──
  app.get('/metrics', async (request, reply) => {
    const { tenantId } = request.user;
    const now = new Date();

    // 1. Contagem de ativos por status
    const assets = await prisma.asset.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true }
    });

    const totalAssets = assets.reduce((acc, curr) => acc + curr._count._all, 0);
    const operationalAssets = assets.find(a => a.status === 'OPERACIONAL')?._count._all || 0;
    const availabilityRate = totalAssets > 0 ? ((operationalAssets / totalAssets) * 100).toFixed(1) : '100.0';

    // 2. Ordens de serviço ativas e estouradas de SLA
    const activeWOs = await prisma.workOrder.findMany({
      where: {
        tenantId,
        status: { in: ['ABERTA', 'EM_TRIAGEM', 'APROVADA', 'EM_EXECUCAO', 'AGUARDANDO_PECA', 'VALIDACAO_QA'] }
      },
      select: {
        id: true,
        priority: true,
        slaDeadline: true
      }
    });

    const totalActive = activeWOs.length;
    const slaBreached = activeWOs.filter(wo => new Date(wo.slaDeadline) < now).length;
    const criticalBerthWOs = activeWOs.filter(wo => wo.priority === 'EMERGENCIAL_BERCO').length;

    // 3. Cálculo de MTTR (Mean Time to Repair em Horas) das OS concluídas nos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completedWOs = await prisma.workOrder.findMany({
      where: {
        tenantId,
        status: 'CONCLUIDA',
        completedAt: { gte: thirtyDaysAgo },
        startedAt: { not: null }
      },
      select: { startedAt: true, completedAt: true }
    });

    let totalRepairHours = 0;
    completedWOs.forEach(wo => {
      if (wo.startedAt && wo.completedAt) {
        const diffMs = new Date(wo.completedAt).getTime() - new Date(wo.startedAt).getTime();
        totalRepairHours += diffMs / (1000 * 60 * 60);
      }
    });

    const mttrHours = completedWOs.length > 0 ? (totalRepairHours / completedWOs.length).toFixed(1) : '0.0';

    return reply.send({
      metrics: {
        totalAssets,
        operationalAssets,
        availabilityRate: `${availabilityRate}%`,
        totalActiveWorkOrders: totalActive,
        slaBreachedWorkOrders: slaBreached,
        criticalBerthWorkOrders: criticalBerthWOs,
        mttrHours: `${mttrHours}h`,
        completedLast30Days: completedWOs.length
      }
    });
  });
}
