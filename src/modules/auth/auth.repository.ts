import prisma from '../../config/prisma';
import bcrypt from 'bcrypt';

class AuthRepository {
  // Método optimizado para verificar existencia de email
  async findByEmail(email: string, select?: any) {
    return await prisma.user.findUnique({
      where: { email },
      select: select || undefined
    });
  }

  async findByEmailWithRole(email: string) {
    return await prisma.user.findUnique({
      where: { 
        email,
        isActive: true // Solo usuarios activos
      },
      include: {
        role: true
      }
    });
  }

  async findRoleByName(name: string) {
    return await prisma.role.findUnique({
      where: { name }
    });
  }

  async createUser(data: any) {
    return await prisma.user.create({
      data,
      include: {
        role: true
      }
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { 
        id,
        isActive: true // Solo usuarios activos
      },
      include: {
        role: true
      }
    });
  }

  async findManyUsers(options: any) {
    return await prisma.user.findMany({
      ...options,
      // Asegurar que siempre incluya el filtro de usuarios activos
      where: {
        ...options.where,
        isActive: true
      }
    });
  }

  async countUsers(where: any) {
    return await prisma.user.count({ 
      where: {
        ...where,
        isActive: true
      }
    });
  }

  async updateUser(id: string, data: any) {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true
      }
    });
  }

  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id }
    });
  }

  // Método optimizado para reset de contraseña
  async updatePassword(email: string, hashedPassword: string) {
    return await prisma.user.update({
      where: { 
        email,
        isActive: true
      },
      data: { password: hashedPassword },
      select: { id: true, email: true } // Solo retornar campos necesarios
    });
  }

  async createUserWithTransaction(data: any) {
    return await prisma.$transaction(async (tx) => {
      // Verificar email en la transacción (solo ID para optimizar)
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
        select: { id: true }
      });
      
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Obtener rol CITIZEN (usar findFirst con cache)
      const citizenRole = await tx.role.findFirst({
        where: { name: 'CITIZEN' },
        select: { id: true, name: true }
      });
      
      if (!citizenRole) {
        throw new Error('Rol CITIZEN no encontrado');
      }

      // Encriptar contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Crear usuario
      const userData = {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber || null,
        roleId: citizenRole.id,
        isActive: true
      };

      const user = await tx.user.create({
        data: userData,
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        user,
        role: citizenRole
      };
    }, {
      timeout: 10000, // 10 segundos timeout
      isolationLevel: 'ReadCommitted' // Nivel de aislamiento optimizado
    });
  }
}

export default new AuthRepository();