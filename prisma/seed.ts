import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
  
  const createdRoles: { [key: string]: any } = {};
  
  for (const role of roles) {
    let existingRole = await prisma.role.findUnique({
      where: { name: role.name }
    });

    if (!existingRole) {
      existingRole = await prisma.role.create({
        data: role
      });
      console.log(`✅ Rol creado: ${role.name}`);
    } else {
      console.log(`⚠️  Rol ya existe: ${role.name}`);
    }
    
    createdRoles[role.name] = existingRole;
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

  // Crear categorías básicas
  const categories = [
    { name: 'ELECTRICIDAD'},
    { name: 'AGUA'},
    { name: 'ALCANTARILLADO'},
    { name: 'TELEFONIA'},
    { name: 'INTERNET'},
    { name: 'VIALIDAD'},
    { name: 'ALUMBRADO'},
    { name: 'ASEO'},
    { name: 'OTROS'}
  ];

  console.log('📂 Creando categorías...');
  
  const createdCategories: { [key: string]: any } = {};
  
  for (const category of categories) {
    let existingCategory = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (!existingCategory) {
      existingCategory = await prisma.category.create({
        data: category
      });
      console.log(`✅ Categoría creada: ${category.name}`);
    } else {
      console.log(`⚠️  Categoría ya existe: ${category.name}`);
    }
    
    createdCategories[category.name] = existingCategory;
  }

  // Crear empresas
  console.log('🏢 Creando empresas...');
  
  const companies = [
    {
      name: 'Hidrobolívar',
      description: 'Empresa de servicios de agua potable',
      rif: 'J-12345678-0',
      address: 'Puerto Ordaz, Estado Bolívar',
      categories: ['AGUA']
    },
    {
      name: 'Corpoelec',
      description: 'Corporación Eléctrica Nacional',
      rif: 'J-87654321-0',
      address: 'Puerto Ordaz, Estado Bolívar',
      categories: ['ELECTRICIDAD']
    },
    {
      name: 'Fospuca',
      description: 'Empresa de servicios de aseo urbano',
      rif: 'J-11223344-0',
      address: 'Puerto Ordaz, Estado Bolívar',
      categories: ['ASEO']
    }
  ];

  const createdCompanies: { [key: string]: any } = {};

  for (const company of companies) {
    let existingCompany = await prisma.company.findFirst({
      where: { name: company.name }
    });

    if (!existingCompany) {
      existingCompany = await prisma.company.create({
        data: {
          name: company.name,
          description: company.description,
          rif: company.rif,
          address: company.address,
          isActive: true
        }
      });
      console.log(`✅ Empresa creada: ${company.name}`);

      // Crear relaciones con categorías
      for (const categoryName of company.categories) {
        const category = createdCategories[categoryName];
        if (category) {
          const existingRelation = await prisma.companyCategory.findFirst({
            where: {
              companyId: existingCompany.id,
              categoryId: category.id
            }
          });

          if (!existingRelation) {
            await prisma.companyCategory.create({
              data: {
                companyId: existingCompany.id,
                categoryId: category.id
              }
            });
            console.log(`   ↳ Categoría asignada: ${categoryName}`);
          }
        }
      }
    } else {
      console.log(`⚠️  Empresa ya existe: ${company.name}`);
    }

    createdCompanies[company.name] = existingCompany;
  }

  // Crear usuarios de prueba
  console.log('👥 Creando usuarios de prueba...');
  
  const testUsers = [
    {
      name: 'Admin',
      lastname: 'Sistema',
      email: 'admin@example.com',
      password: 'admin',
      phoneNumber: '+58 414 1234567',
      roleName: 'ADMIN',
      companyName: null
    },
    {
      name: 'Hidrobolívar',
      lastname: 'Representante',
      email: 'hidrobolivar@example.com',
      password: 'admin',
      phoneNumber: '+58 414 2345678',
      roleName: 'COMPANY',
      companyName: 'Hidrobolívar'
    },
    {
      name: 'Corpoelec',
      lastname: 'Representante',
      email: 'corpoelec@example.com',
      password: 'admin',
      phoneNumber: '+58 414 3456789',
      roleName: 'COMPANY',
      companyName: 'Corpoelec'
    },
    {
      name: 'Fospuca',
      lastname: 'Representante',
      email: 'fospuca@example.com',
      password: 'admin',
      phoneNumber: '+58 414 4567890',
      roleName: 'COMPANY',
      companyName: 'Fospuca'
    },
    {
      name: 'Trabajador',
      lastname: 'Campo',
      email: 'worker@example.com',
      password: 'admin',
      phoneNumber: '+58 414 5678901',
      roleName: 'WORKER',
      companyName: null
    },
    {
      name: 'Ciudadano',
      lastname: 'Usuario',
      email: 'citizen@example.com',
      password: 'admin',
      phoneNumber: '+58 414 6789012',
      roleName: 'CITIZEN',
      companyName: null
    }
  ];

  for (const user of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!existingUser) {
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const userData: any = {
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        password: hashedPassword,
        phoneNumber: user.phoneNumber,
        roleId: createdRoles[user.roleName].id,
        isActive: true
      };

      // Asignar empresa si corresponde
      if (user.companyName && createdCompanies[user.companyName]) {
        userData.companyId = createdCompanies[user.companyName].id;
      }

      await prisma.user.create({
        data: userData
      });
      console.log(`✅ Usuario creado: ${user.email} (${user.roleName}${user.companyName ? ` - ${user.companyName}` : ''})`);
    } else {
      console.log(`⚠️  Usuario ya existe: ${user.email}`);
    }
  }

  console.log('\n📋 RESUMEN DE USUARIOS DE PRUEBA:');
  console.log('================================');
  console.log('👤 Admin:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin');
  console.log('');
  console.log('🏢 Empresas:');
  console.log('   Hidrobolívar:');
  console.log('     Email: hidrobolivar@example.com');
  console.log('     Password: admin');
  console.log('     Categoría: AGUA');
  console.log('');
  console.log('   Corpoelec:');
  console.log('     Email: corpoelec@example.com');
  console.log('     Password: admin');
  console.log('     Categoría: ELECTRICIDAD');
  console.log('');
  console.log('   Fospuca:');
  console.log('     Email: fospuca@example.com');
  console.log('     Password: admin');
  console.log('     Categoría: ASEO');
  console.log('');
  console.log('👷 Worker:');
  console.log('   Email: worker@example.com');
  console.log('   Password: admin');
  console.log('');
  console.log('👨 Citizen:');
  console.log('   Email: citizen@example.com');
  console.log('   Password: admin');
  console.log('================================\n');

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
