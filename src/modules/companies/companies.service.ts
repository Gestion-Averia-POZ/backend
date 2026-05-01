import { companiesRepository } from './companies.repository';
import { CreateCompanyData, UpdateCompanyData } from './companies.validation';

class CompaniesService {
  async getAllCompanies() {
    return await companiesRepository.findAll();
  }

  async getCompanyById(id: string) {
    const company = await companiesRepository.findById(id);
    if (!company) {
      throw new Error('Compañía no encontrada');
    }
    return company;
  }

  async getCompaniesByCategoryName(categoryName: string) {
    return await companiesRepository.findByCategoryName(categoryName);
  }

  async createCompany(data: CreateCompanyData) {
    const existingCompany = await companiesRepository.findByName(data.name);
    if (existingCompany) {
      throw new Error('Ya existe una compañía con este nombre');
    }
    
    if (data.rif) {
      const existingRif = await companiesRepository.findByRif(data.rif);
      if (existingRif) {
        throw new Error('Ya existe una compañía con este RIF');
      }
    }

    return await companiesRepository.create(data);
  }

  async updateCompany(id: string, data: UpdateCompanyData) {
    await this.getCompanyById(id);
    
    if (data.name) {
      const existingCompany = await companiesRepository.findByName(data.name);
      if (existingCompany && existingCompany.id !== id) {
        throw new Error('Ya existe otra compañía con este nombre');
      }
    }

    if (data.rif) {
      const existingRif = await companiesRepository.findByRif(data.rif);
      if (existingRif && existingRif.id !== id) {
        throw new Error('Ya existe otra compañía con este RIF');
      }
    }
    
    return await companiesRepository.update(id, data);
  }

  async deactivateCompany(id: string) {
    await this.getCompanyById(id);
    return await companiesRepository.deactivate(id);
  }
}

export const companiesService = new CompaniesService();
