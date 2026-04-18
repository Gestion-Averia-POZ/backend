import prisma from '../../config/prisma';

class AuthRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async findByEmailWithRole(email: string) {
    return await prisma.user.findUnique({
      where: { email },
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
      where: { id },
      include: {
        role: true
      }
    });
  }

  async findManyUsers(options: any) {
    return await prisma.user.findMany(options);
  }

  async countUsers(where: any) {
    return await prisma.user.count({ where });
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

  async createUserWithTransaction(data: any) {
    return await prisma.$transaction(async (tx) => {
      // Verificar email en la transacción
      const existingUser = await tx.user.findUnique({
        where: { email: data.email }
      });
      
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Obtener rol CITIZEN 
      const citizenRole = await tx.role.findFirst({
        where: { name: 'CITIZEN' }
      });
      
      if (!citizenRole) {
        throw new Error('Rol CITIZEN no encontrado');
      }

      // Encriptar contraseña
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Crear usuario
      const userData = {
        ...data,
        password: hashedPassword,
        roleId: citizenRole.id,
        isActive: true,
        verifiedEmail: false
      };

      const user = await tx.user.create({
        data: userData
      });

      return {
        user,
        role: citizenRole
      };
    });
  }
}

export default new AuthRepository();