import prisma from '../../config/prisma';
import { CreateCompanyData, UpdateCompanyData } from './companies.validation';

class CompaniesRepository {
  async findAll() {
    return await prisma.company.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findById(id: string) {
    return await prisma.company.findUnique({
      where: { id },
      include: {
        companyCategories: {
          include: { category: true },
        },
      },
    });
  }

  async findByName(name: string) {
    return await prisma.company.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
  }

  async findByRif(rif: string) {
    return await prisma.company.findUnique({
      where: { rif }
    });
  }

  async findByCategoryName(categoryName: string) {
    return await prisma.company.findMany({
      where: {
        isActive: true,
        companyCategories: {
          some: {
            category: {
              name: {
                equals: categoryName,
                mode: 'insensitive'
              },
              isActive: true
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async create(data: CreateCompanyData) {
    return await prisma.company.create({
      data
    });
  }

  async findRelatedCitizens(companyId: string) {
    return await prisma.user.findMany({
      where: {
        role: {
          name: {
            equals: 'CITIZEN',
            mode: 'insensitive'
          }
        },
        reports: {
          some: {
            companyId: companyId,
            isActive: true
          }
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }


  async update(id: string, data: UpdateCompanyData) {
    return await prisma.company.update({
      where: { id },
      data
    });
  }

  async deactivate(id: string) {
    return await prisma.company.update({
      where: { id },
      data: {
        isActive: false
      }
    });
  }
}

export const companiesRepository = new CompaniesRepository();
