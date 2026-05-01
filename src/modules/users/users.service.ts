import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';

class UsersService {
  async createEmployee(data: any, creatorId: string) {
    // Buscar la compañía del creador
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { companyId: true, role: { select: { name: true } } }
    });

    if (!creator) {
      throw new Error('Usuario creador no encontrado');
    }

    // Definir la compañía a asignar
    let targetCompanyId = data.companyId;

    if (!targetCompanyId) {
      throw new Error('El ID de compañía es obligatorio para crear un empleado');
    }

    // Si el creador es COMPANY, forzar que use su propia compañía
    if (creator.role?.name === 'COMPANY') {
      targetCompanyId = creator.companyId;
    }


    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Buscar el rol WORKER
    const workerRole = await prisma.role.findUnique({
      where: { name: 'WORKER' }
    });

    if (!workerRole) {
      throw new Error('Rol WORKER no encontrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear el empleado
    return await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        roleId: workerRole.id,
        companyId: targetCompanyId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        role: { select: { name: true } },
        company: { select: { id: true, name: true, rif: true } }
      }
    });
  }


  async createCompanyUser(data: any) {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Buscar el rol COMPANY
    const companyRole = await prisma.role.findUnique({
      where: { name: 'COMPANY' }
    });

    if (!companyRole) {
      throw new Error('Rol COMPANY no encontrado');
    }

    // Verificar que la compañía existe
    const company = await prisma.company.findUnique({
      where: { id: data.companyId }
    });

    if (!company) {
      throw new Error('La compañía especificada no existe');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear el usuario company
    return await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        roleId: companyRole.id,
        companyId: data.companyId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        role: { select: { name: true } },
        company: { select: { name: true } }
      }
    });
  }
}

export const usersService = new UsersService();
