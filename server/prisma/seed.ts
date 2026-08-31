import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Iniciando Seed do PortLog OS...');

  // 1. Cria o Tenant Portuário de Demonstração
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'mucuripe-port' },
    update: {},
    create: {
      name: 'Terminal Portuário do Mucuripe',
      slug: 'mucuripe-port',
      cnpj: '07.123.456/0001-99',
      active: true
    }
  });

  console.log(`✅ Tenant criado: ${tenant.name} (${tenant.id})`);

  // 2. Cria o Usuário Administrador Master
  const passwordHash = await bcrypt.hash('pedrooliveira1227!', 10);
  
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@mucuripe.com'
      }
    },
    update: {
      passwordHash
    },
    create: {
      tenantId: tenant.id,
      name: 'Pedro Henrique (Superintendente)',
      email: 'admin@mucuripe.com',
      passwordHash,
      role: 'ADMIN_MASTER',
      active: true
    }
  });

  console.log(`✅ Usuário Administrador criado: ${user.name} (${user.email})`);

  // 3. Cadastra Equipamentos Portuários Iniciais (Frotas de Berço)
  const assetsData = [
    { code: 'STS-01', name: 'Super Post-Panamax STS 01', category: 'GUINDASTE_STS', status: 'OPERACIONAL', locationBerth: 'Berço 101 (Cais Norte)', hourMeter: 1240.5 },
    { code: 'STS-02', name: 'Post-Panamax STS 02', category: 'GUINDASTE_STS', status: 'OPERACIONAL', locationBerth: 'Berço 102 (Cais Norte)', hourMeter: 980.2 },
    { code: 'RTG-04', name: 'Rubber Tyred Gantry 04', category: 'GUINDASTE_RTG', status: 'OPERACIONAL', locationBerth: 'Quadra C - Bloco 2', hourMeter: 3410.0 },
    { code: 'RS-02', name: 'Reach Stacker Kalmar 45T', category: 'REACH_STACKER', status: 'EM_MANUTENCAO', locationBerth: 'Pátio de Vazio Sul', hourMeter: 5120.8 },
    { code: 'REBOC-01', name: 'Rebocador Dragão do Mar 60T BP', category: 'REBOCADOR_MARITIMO', status: 'OPERACIONAL', locationBerth: 'Canal de Acesso / Bacia', hourMeter: 840.0 },
  ];

  for (const asset of assetsData) {
    await prisma.asset.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: asset.code
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        code: asset.code,
        name: asset.name,
        category: asset.category as any,
        status: asset.status as any,
        locationBerth: asset.locationBerth,
        hourMeter: asset.hourMeter
      }
    });
  }

  console.log('✅ Equipamentos portuários semeados!');

  // 4. Cria Ordens de Serviço Iniciais
  const sts01 = await prisma.asset.findFirst({ where: { tenantId: tenant.id, code: 'STS-01' } });
  const rs02 = await prisma.asset.findFirst({ where: { tenantId: tenant.id, code: 'RS-02' } });

  if (sts01 && rs02) {
    // OS 1: Preventiva
    await prisma.workOrder.upsert({
      where: {
        tenantId_orderNumber: {
          tenantId: tenant.id,
          orderNumber: 1001
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        orderNumber: 1001,
        assetId: sts01.id,
        type: 'PREVENTIVA_PROGRAMADA',
        priority: 'MEDIA',
        status: 'EM_EXECUCAO',
        title: 'Inspeção Semanal do Sistema Hidráulico & Cabos de Aço',
        description: 'Verificação de pressão das bombas principais e teste de estanqueidade dos cilindros do spreader.',
        slaDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000),
        startedAt: new Date(),
        createdById: user.id,
        assignedToId: user.id
      }
    });

    // OS 2: Emergencial Berço
    await prisma.workOrder.upsert({
      where: {
        tenantId_orderNumber: {
          tenantId: tenant.id,
          orderNumber: 1002
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        orderNumber: 1002,
        assetId: rs02.id,
        type: 'CORRETIVA_URGENTE',
        priority: 'EMERGENCIAL_BERCO',
        status: 'AGUARDANDO_PECA',
        title: 'Falha no Atuador de Giro do Spreader Kalmar',
        description: 'Vazamento de fluido hidráulico na junta principal impedindo a trava do container de 40ft.',
        slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
        createdById: user.id
      }
    });
  }

  console.log('✅ Ordens de serviço semeadas com sucesso!');
  console.log('🚢 Seed concluído com sucesso no Supabase!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
