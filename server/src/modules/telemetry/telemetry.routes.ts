import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';

interface SensorReading {
  assetId: string;
  assetCode: string;
  assetName: string;
  temperature: number;
  vibration: number;
  hydraulicPressure: number;
  healthScore: number;
  status: 'NORMAL' | 'ALERTA' | 'CRITICO';
  timestamp: string;
}

export async function telemetryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── 1. LEITURA DE TELEMETRIA EM TEMPO REAL DOS EQUIPAMENTOS ──
  app.get('/live', async (request, reply) => {
    const { tenantId } = request.user;

    const assets = await prisma.asset.findMany({
      where: { tenantId },
      select: { id: true, code: true, name: true, category: true, status: true, locationBerth: true }
    });

    const now = new Date();

    const readings: SensorReading[] = assets.map((asset, index) => {
      const timeFactor = Math.sin(now.getTime() / 10000 + index);
      const isUnderMaintenance = asset.status === 'EM_MANUTENCAO';
      
      const baseTemp = isUnderMaintenance ? 82.5 : 55.0;
      const baseVib = isUnderMaintenance ? 7.8 : 2.4;
      const basePress = 210.0;

      const temperature = Number((baseTemp + timeFactor * 4.5).toFixed(1));
      const vibration = Number((baseVib + (timeFactor * 0.8)).toFixed(2));
      const hydraulicPressure = Number((basePress + timeFactor * 12).toFixed(1));

      let status: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
      let healthScore = 96;

      if (temperature >= 80 || vibration >= 7.0) {
        status = 'CRITICO';
        healthScore = 52;
      } else if (temperature >= 68 || vibration >= 4.5) {
        status = 'ALERTA';
        healthScore = 78;
      }

      return {
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        temperature,
        vibration,
        hydraulicPressure,
        healthScore,
        status,
        timestamp: now.toISOString()
      };
    });

    return reply.send({ readings });
  });

  // ── 2. DISPARO AUTOMÁTICO DE OS PREDITIVA VIA IOT ANOMALY DETECTION ──
  app.post('/trigger-anomaly', async (request, reply) => {
    const bodySchema = z.object({
      assetId: z.string().uuid(),
      sensorType: z.enum(['TEMPERATURA', 'VIBRACAO', 'PRESSAO_HIDRAULICA']),
      currentValue: z.number(),
      threshold: z.number()
    });

    const { assetId, sensorType, currentValue, threshold } = bodySchema.parse(request.body);
    const { tenantId, sub: userId } = request.user;

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, tenantId }
    });

    if (!asset) {
      throw new AppError('Equipamento não encontrado.', 404);
    }

    const workOrder = await prisma.$transaction(async (tx) => {
      const count = await tx.workOrder.count({ where: { tenantId } });
      const nextOrderNumber = 1001 + count;

      const slaDeadline = new Date(Date.now() + 8 * 60 * 60 * 1000);

      const createdWO = await tx.workOrder.create({
        data: {
          tenantId,
          orderNumber: nextOrderNumber,
          assetId,
          type: 'PREDITIVA_SENSOR',
          priority: 'EMERGENCIAL_BERCO',
          status: 'ABERTA',
          title: `[ALERTA IoT] Anomalia Crítica de ${sensorType} em ${asset.code}`,
          description: `Disparo automático do motor de IA Preditiva. O sensor registrou ${currentValue} (limite operacional seguro: ${threshold}). Risco de falha catastrófica no berço.`,
          slaDeadline,
          createdById: userId
        }
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'EM_MANUTENCAO' }
      });

      await tx.wOChecklist.createMany({
        data: [
          { workOrderId: createdWO.id, taskItem: `Efetuar termografia infravermelha no sensor de ${sensorType}` },
          { workOrderId: createdWO.id, taskItem: 'Verificar nível e viscosidade do fluido hidráulico' },
          { workOrderId: createdWO.id, taskItem: 'Recalibrar limites do transdutor de telemetria' }
        ]
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'IOT_PREDICTIVE_WO_TRIGGERED',
          entity: 'WorkOrder',
          entityId: createdWO.id,
          details: {
            sensorType,
            currentValue,
            threshold,
            assetCode: asset.code
          }
        }
      });

      return createdWO;
    });

    return reply.status(201).send({
      message: 'Ordem de serviço preditiva aberta automaticamente pelo motor IoT!',
      workOrder
    });
  });
}
