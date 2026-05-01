import { categoriesRepository } from './categories.repository';
import { CreateCategoryData, UpdateCategoryData } from './categories.validation';

class CategoriesService {
  async getAllCategories() {
    return await categoriesRepository.findAll();
  }

  async getCategoryById(id: string) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new Error('Categoría no encontrada');
    }
    return category;
  }

  async createCategory(data: CreateCategoryData) {
    const existingCategory = await categoriesRepository.findByName(data.name);
    if (existingCategory) {
      throw new Error('Ya existe una categoría con este nombre');
    }
    return await categoriesRepository.create(data);
  }

  async updateCategory(id: string, data: UpdateCategoryData) {
    await this.getCategoryById(id);
    
    if (data.name) {
      const existingCategory = await categoriesRepository.findByName(data.name);
      if (existingCategory && existingCategory.id !== id) {
        throw new Error('Ya existe otra categoría con este nombre');
      }
    }
    
    return await categoriesRepository.update(id, data);
  }

  async deactivateCategory(id: string) {
    await this.getCategoryById(id);
    return await categoriesRepository.deactivate(id);
  }
}

export const categoriesService = new CategoriesService();
