import prisma from '../../config/prisma';
import { CreateFailureTypeData, UpdateFailureTypeData } from './failure-types.validation';

class FailureTypesRepository {
  async findAll() {
    return await prisma.failureType.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: number) {
    return await prisma.failureType.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async findByCategory(categoryId: string) {
    return await prisma.failureType.findMany({
      where: {
        categoryId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async findByNameInCategory(name: string, categoryId?: string) {
    return await prisma.failureType.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        categoryId: categoryId || null,
        isActive: true
      }
    });
  }

  async create(data: CreateFailureTypeData) {
    return await prisma.failureType.create({
      data: {
        name: data.name,
        description: data.description,
        priority: data.priority,
        categoryId: data.categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async update(id: number, data: UpdateFailureTypeData) {
    return await prisma.failureType.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async deactivate(id: number) {
    return await prisma.failureType.update({
      where: { id },
      data: { isActive: false }
    });
  }
}

export const failureTypesRepository = new FailureTypesRepository();
