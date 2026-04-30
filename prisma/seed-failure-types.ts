/**
 * Seed: Tipos de Falla (FailureType)
 * 
 * Crea 6 tipos de falla para cada categoría:
 *  - ELECTRICIDAD
 *  - AGUA
 *  - ASEO
 * 
 * Uso:
 *   npx ts-node prisma/seed-failure-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Definición de tipos de falla por categoría ──────────────────────────────

const FAILURE_TYPES: Record<string, { name: string; description: string; priority: string }[]> = {
  ELECTRICIDAD: [
    {
      name: 'Apagón total del sector',
      description: 'Pérdida completa del suministro eléctrico en toda la zona afectada',
      priority: 'ALTA'
    },
    {
      name: 'Falla en transformador',
      description: 'Transformador dañado o fuera de servicio que afecta el suministro eléctrico',
      priority: 'ALTA'
    },
    {
      name: 'Cortocircuito en cableado público',
      description: 'Cortocircuito en cables del tendido eléctrico que representa riesgo de incendio',
      priority: 'ALTA'
    },
    {
      name: 'Interrupción parcial de suministro',
      description: 'Corte de luz que afecta a algunas casas o manzanas del sector',
      priority: 'MEDIA'
    },
    {
      name: 'Fluctuación de voltaje',
      description: 'Variaciones inestables de voltaje que dañan electrodomésticos',
      priority: 'MEDIA'
    },
    {
      name: 'Daño en medidor eléctrico',
      description: 'Medidor de electricidad dañado, sin lectura o con fuga',
      priority: 'BAJA'
    }
  ],

  AGUA: [
    {
      name: 'Fuga mayor en tubería principal',
      description: 'Ruptura o fuga grave en la tubería principal que desperdicia grandes volúmenes de agua',
      priority: 'ALTA'
    },
    {
      name: 'Corte total del suministro de agua',
      description: 'Sector sin agua potable por más de 24 horas sin aviso previo',
      priority: 'ALTA'
    },
    {
      name: 'Contaminación del agua potable',
      description: 'Agua con color, olor o sabor anormal que indica posible contaminación',
      priority: 'ALTA'
    },
    {
      name: 'Fuga menor en tubería secundaria',
      description: 'Fuga de agua en tuberías secundarias o acometidas domiciliarias',
      priority: 'MEDIA'
    },
    {
      name: 'Baja presión de agua',
      description: 'El agua llega con presión insuficiente para uso normal en los hogares',
      priority: 'MEDIA'
    },
    {
      name: 'Daño en medidor de agua',
      description: 'Medidor de agua roto, sin lectura o marcando consumo incorrecto',
      priority: 'BAJA'
    }
  ],

  ASEO: [
    {
      name: 'Acumulación de basura peligrosa',
      description: 'Desechos peligrosos o médicos depositados en espacios públicos',
      priority: 'ALTA'
    },
    {
      name: 'Sin recolección por más de una semana',
      description: 'El camión de basura no ha pasado en más de 7 días generando foco de infección',
      priority: 'ALTA'
    },
    {
      name: 'Desbordamiento de contenedor comunitario',
      description: 'Contenedor de basura lleno y desbordado con residuos en la vía pública',
      priority: 'MEDIA'
    },
    {
      name: 'Falta de recolección de 3 días',
      description: 'El servicio de recolección no ha pasado en los últimos 3 días',
      priority: 'MEDIA'
    },
    {
      name: 'Daño en contenedor comunitario',
      description: 'Contenedor de basura roto, quemado o en mal estado',
      priority: 'BAJA'
    },
    {
      name: 'Limpieza de espacio público',
      description: 'Solicitud de limpieza de parques, plazas, aceras o zonas verdes',
      priority: 'BAJA'
    }
  ]
};

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seedFailureTypes() {
  console.log('\n🌱 Iniciando seed de tipos de falla (FailureType)...\n');

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const [categoryName, failureTypes] of Object.entries(FAILURE_TYPES)) {
    // Buscar la categoría por nombre
    const category = await prisma.category.findFirst({
      where: { name: categoryName, isActive: true }
    });

    if (!category) {
      console.warn(`⚠️  Categoría "${categoryName}" no encontrada. Saltando...`);
      console.warn(`   → Asegúrate de haber corrido el seed principal primero: npm run db:seed\n`);
      continue;
    }

    console.log(`📂 Categoría: ${categoryName} (ID: ${category.id})`);

    for (const ft of failureTypes) {
      const existing = await prisma.failureType.findFirst({
        where: { name: ft.name, categoryId: category.id }
      });

      if (existing) {
        console.log(`   ⚠️  Ya existe: "${ft.name}" [${ft.priority}]`);
        totalSkipped++;
        continue;
      }

      await prisma.failureType.create({
        data: {
          name:        ft.name,
          description: ft.description,
          priority:    ft.priority,
          categoryId:  category.id,
          isActive:    true
        }
      });

      console.log(`   ✅ Creado: "${ft.name}" [${ft.priority}]`);
      totalCreated++;
    }

    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`✅ Tipos de falla creados:  ${totalCreated}`);
  console.log(`⚠️  Ya existían (saltados): ${totalSkipped}`);
  console.log(`📊 Total procesados:        ${totalCreated + totalSkipped}`);
  console.log('─'.repeat(50) + '\n');
}

seedFailureTypes()
  .catch((err) => {
    console.error('\n❌ Error en el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
