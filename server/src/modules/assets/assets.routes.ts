import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

export async function assetRoutes(app: FastifyInstance) {
  // Todas as rotas de assets exigem autenticação prévia
  app.addHook('preHandler', authenticate);

  // ── 1. LISTAR ATIVOS DO TERMINAL COM FILTROS ──
  app.get('/', async (request, reply) => {
    const querySchema = z.object({
      status: z.enum(['OPERACIONAL', 'EM_MANUTENCAO', 'INOPERANTE_CRITICO', 'DESATIVADO']).optional(),
      category: z.enum(['GUINDASTE_STS', 'GUINDASTE_RTG', 'REACH_STACKER', 'TERMINAL_TRACTOR', 'REBOCADOR_MARITIMO']).optional(),
      search: z.string().optional()
    });

    const { status, category, search } = querySchema.parse(request.query);
    const { tenantId } = request.user;

    const assets = await prisma.asset.findMany({
      where: {
        tenantId, // ISOLAMENTO RIGOROSO DE TENANT
        ...(status && { status }),
        ...(category && { category }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { locationBerth: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            workOrders: {
              where: { status: { in: ['ABERTA', 'EM_TRIAGEM', 'APROVADA', 'EM_EXECUCAO'] } }
            }
          }
        }
      }
    });

    return reply.send({ assets });
  });

  // ── 2. CADASTRAR NOVO ATIVO / EQUIPAMENTO PORTUÁRIO ──
  app.post(
    '/',
    { preHandler: [authorize(['ADMIN_MASTER', 'SUPERVISOR_OPERACIONAL'])] },
    async (request, reply) => {
      const createAssetSchema = z.object({
        code: z.string().min(2).max(50).toUpperCase(),
        name: z.string().min(3).max(120),
        category: z.enum(['GUINDASTE_STS', 'GUINDASTE_RTG', 'REACH_STACKER', 'TERMINAL_TRACTOR', 'REBOCADOR_MARITIMO']),
        locationBerth: z.string().max(60).optional(),
        hourMeter: z.number().min(0).default(0.0)
      });

      const body = createAssetSchema.parse(request.body);
      const { tenantId, sub: userId } = request.user;

      const existingCode = await prisma.asset.findUnique({
        where: { tenantId_code: { tenantId, code: body.code } }
      });

      if (existingCode) {
        throw new AppError(`O código patrimonial '${body.code}' já está cadastrado neste terminal.`, 409);
      }

      const asset = await prisma.$transaction(async (tx) => {
        const created = await tx.asset.create({
          data: {
            tenantId,
            code: body.code,
            name: body.name,
            category: body.category,
            locationBerth: body.locationBerth,
            hourMeter: body.hourMeter
          }
        });

        // Trilha de auditoria
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'ASSET_CREATED',
            entity: 'Asset',
            entityId: created.id,
            details: { code: created.code, name: created.name, category: created.category }
          }
        });

        return created;
      });

      return reply.status(201).send({ asset });
    }
  );

  // ── 3. DETALHES DE UM ATIVO COM HISTÓRICO DE MANUTENÇÕES ──
  app.get('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);
    const { tenantId } = request.user;

    const asset = await prisma.asset.findFirst({
      where: { id, tenantId },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            assignedTo: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });

    if (!asset) {
      throw new AppError('Equipamento não encontrado.', 404);
    }

    return reply.send({ asset });
  });
}
