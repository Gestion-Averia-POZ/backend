import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear roles
  const roles = [
    {
      name: 'ADMIN',
      description: 'Administrador del sistema con acceso completo'
    },
    {
      name: 'COMPANY',
      description: 'Representante de empresa de servicios'
    },
    {
      name: 'WORKER',
      description: 'Trabajador de campo que atiende reportes'
    },
    {
      name: 'CITIZEN',
      description: 'Usuario final que puede crear reportes'
    }
  ];

  console.log('📝 Creando roles...');
  
  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name }
    });

    if (!existingRole) {
      await prisma.role.create({
        data: role
      });
      console.log(`✅ Rol creado: ${role.name}`);
    } else {
      console.log(`⚠️  Rol ya existe: ${role.name}`);
    }
  }

  // Crear algunos estados básicos
  const states = [
    { name: 'PENDIENTE', colorHex: '#FFA500' },
    { name: 'EN_PROCESO', colorHex: '#0066CC' },
    { name: 'COMPLETADO', colorHex: '#00AA00' },
    { name: 'CANCELADO', colorHex: '#CC0000' }
  ];

  console.log('📊 Creando estados...');
  
  for (const state of states) {
    const existingState = await prisma.state.findFirst({
      where: { name: state.name }
    });

    if (!existingState) {
      await prisma.state.create({
        data: state
      });
      console.log(`✅ Estado creado: ${state.name}`);
    } else {
      console.log(`⚠️  Estado ya existe: ${state.name}`);
    }
  }

  // Crear algunas categorías básicas
  const categories = [
    { name: 'ELECTRICIDAD'},
    { name: 'AGUA'},
    { name: 'ALCANTARILLADO'},
    { name: 'TELEFONIA'},
    { name: 'INTERNET'},
    { name: 'VIALIDAD'},
    { name: 'ALUMBRADO'},
    { name: 'OTROS'}
  ];

  console.log('📂 Creando categorías...');
  
  for (const category of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: category
      });
      console.log(`✅ Categoría creada: ${category.name}`);
    } else {
      console.log(`⚠️  Categoría ya existe: ${category.name}`);
    }
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });