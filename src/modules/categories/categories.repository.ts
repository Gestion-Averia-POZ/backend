import prisma from '../../config/prisma';
import { CreateCategoryData, UpdateCategoryData } from './categories.validation';

class CategoriesRepository {
  async findAll() {
    return await prisma.category.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findById(id: string) {
    return await prisma.category.findUnique({
      where: { id }
    });
  }

  async findByName(name: string) {
    return await prisma.category.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
  }

  async create(data: CreateCategoryData) {
    return await prisma.category.create({
      data: {
        name: data.name
      }
    });
  }

  async update(id: string, data: UpdateCategoryData) {
    return await prisma.category.update({
      where: { id },
      data
    });
  }

  async deactivate(id: string) {
    return await prisma.category.update({
      where: { id },
      data: {
        isActive: false
      }
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
