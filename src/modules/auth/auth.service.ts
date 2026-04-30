import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authRepository from './auth.repository';
import { RegisterData, UpdateUserData } from './auth.validation';

class AuthService {
  async register(data: RegisterData) {
    // Usar transacción para optimizar consultas
    const result = await authRepository.createUserWithTransaction(data);
    
    // Generar JWT
    const token = this.generateToken(result.user.id, result.user.email, result.role.name);

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        lastname: result.user.lastname,
        email: result.user.email,
        role: result.role.name,
        isActive: result.user.isActive,
      },
      token
    };
  }

  async login(email: string, password: string) {
    // Buscar usuario por email
    const user = await authRepository.findByEmailWithRole(email);
    if (!user) {
      throw new Error('El email no está registrado');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new Error('Usuario inactivo. Contacta al administrador.');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Contraseña incorrecta');
    }

    // Generar JWT
    const token = this.generateToken(user.id, user.email, user.role?.name || 'CITIZEN');

    return {
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role?.name,
        isActive: user.isActive
      },
      token
    };
  }

  async checkEmailExists(email: string): Promise<boolean> {
    // Usar select específico para optimizar la consulta
    const user = await authRepository.findByEmail(email, { id: true });
    return !!user;
  }

  async getUserById(id: string) {
    const user = await authRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Solo mostrar usuarios activos
    if (!user.isActive) {
      throw new Error('Usuario no disponible');
    }

    return {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async getUserByEmail(email: string) {
    const user = await authRepository.findByEmailWithRole(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Solo mostrar usuarios activos
    if (!user.isActive) {
      throw new Error('Usuario no disponible');
    }

    return {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async getAllUsers(options: { page: number; limit: number; role?: string; companyName?: string }) {
    const { page, limit, role, companyName } = options;
    const skip = (page - 1) * limit;

    // Construir filtro dinámicamente
    const where: any = { isActive: true };

    if (role) {
      where.role = { name: { contains: role, mode: 'insensitive' } };
    }

    if (companyName) {
      where.company = { name: { contains: companyName, mode: 'insensitive' } };
    }

    const [users, total] = await Promise.all([
      authRepository.findManyUsers({
        skip,
        take: limit,
        where,
        include: { role: true, company: true }
      }),
      authRepository.countUsers(where)
    ]);

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role?.name,
      company: user.company ? { id: user.company.id, name: user.company.name } : null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateUser(id: string, data: UpdateUserData) {
    // Verificar que el usuario existe
    const existingUser = await authRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await authRepository.findByEmail(data.email);
      if (emailExists) {
        throw new Error('El email ya está en uso por otro usuario');
      }
    }

    // Si se está actualizando la contraseña, encriptarla
    let updateData = { ...data };
    if (data.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }

    // Actualizar usuario
    const updatedUser = await authRepository.updateUser(id, updateData);

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role?.name,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    };
  }

  async deleteUser(id: string) {
    // Verificar que el usuario existe
    const existingUser = await authRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Eliminar usuario 
    await authRepository.updateUser(id, { isActive: false });
    
    // O eliminar completamente (hard delete)
    // await authRepository.deleteUser(id);
  }

  async resetPassword(email: string, newPassword: string) {
    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña usando método optimizado
    const updatedUser = await authRepository.updatePassword(email, hashedPassword);
    
    if (!updatedUser) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    return {
      message: 'Contraseña actualizada exitosamente'
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = {
      userId,
      email,
      role
    };

    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado');
    }

    return jwt.sign(payload, secret, { expiresIn: '1h' });
  }
}

export default new AuthService();