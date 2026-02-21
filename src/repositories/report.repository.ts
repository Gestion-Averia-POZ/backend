import prisma from '../config/prisma';

class ReportRepository {
  async findAll() {
    // Consultas directas a la BD usando Prisma
    return await prisma.$queryRaw`SELECT * FROM reports`;
  }

  async create(data: any) {
    return await prisma.$executeRaw`INSERT INTO reports (title) VALUES (${data.title})`;
  }
}

export default new ReportRepository();
