import { failureTypesRepository } from './failure-types.repository';
import { CreateFailureTypeData, UpdateFailureTypeData } from './failure-types.validation';

class FailureTypesService {
  async getAllFailureTypes() {
    return await failureTypesRepository.findAll();
  }

  async getFailureTypeById(id: number) {
    const failureType = await failureTypesRepository.findById(id);
    if (!failureType) {
      throw new Error('Tipo de falla no encontrado');
    }
    return failureType;
  }

  async getFailureTypesByCategory(categoryId: string) {
    return await failureTypesRepository.findByCategory(categoryId);
  }

  async createFailureType(data: CreateFailureTypeData) {
    // Validar duplicados en la misma categoría
    const existing = await failureTypesRepository.findByNameInCategory(data.name, data.categoryId);
    if (existing) {
      throw new Error(`Ya existe un tipo de falla con el nombre "${data.name}" en esta categoría`);
    }

    return await failureTypesRepository.create(data);
  }

  async updateFailureType(id: number, data: UpdateFailureTypeData) {
    await this.getFailureTypeById(id);

    if (data.name) {
      const existing = await failureTypesRepository.findByNameInCategory(data.name, data.categoryId);
      if (existing && existing.id !== id) {
        throw new Error(`Ya existe otro tipo de falla con el nombre "${data.name}" en esta categoría`);
      }
    }

    return await failureTypesRepository.update(id, data);
  }

  async deactivateFailureType(id: number) {
    await this.getFailureTypeById(id);
    return await failureTypesRepository.deactivate(id);
  }
}

export const failureTypesService = new FailureTypesService();
