import reportRepository from '../repositories/report.repository';

class ReportService {
  async getAllReports() {
    return await reportRepository.findAll();
  }

  async createReport(data: any) {
    // Lógica de negocio, validaciones complejas, cálculos
    return await reportRepository.create(data);
  }
}

export default new ReportService();
