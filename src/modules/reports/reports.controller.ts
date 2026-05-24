import { Request, Response, NextFunction } from 'express';
import * as ExcelJS from 'exceljs';
import reportsService from './reports.service';
import geolocationService from '../../services/geolocation.service';
import geocodingService from '../../services/geocoding.service';
import csvReportsImportService from '../../services/csv-reports-import.service';
import * as xlsx from 'xlsx';
import prisma from '../../config/prisma';

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, latitude, longitude, categoryId, companyId, failureTypeId, assignedManagerId, urlPhoto, address } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const report = await reportsService.createReport({
      description, latitude, longitude, categoryId, userId,
      companyId, failureTypeId, assignedManagerId, urlPhoto, address
    });

    res.status(201).json({
      success: true,
      message: 'Reporte creado exitosamente',
      data: { report }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const detectNeighborhood = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas'
      });
    }

    const neighborhoodId = await geolocationService.getNeighborhoodIdByPoint({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    if (!neighborhoodId) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ningún barrio para estas coordenadas'
      });
    }

    // Obtener información del barrio
    const prisma = (await import('../../config/prisma')).default;
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
      select: {
        id: true,
        name: true
      }
    });

    res.json({
      success: true,
      message: 'Barrio detectado exitosamente',
      data: {
        neighborhood
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const getReportsByNeighborhood = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhoodId } = req.params;
    
    // Extraer filtros opcionales del query
    const filters = {
      serviceName: undefined as undefined,
      failureTypeName: req.query.failureTypeName as string | undefined,
      assignedManagerId: req.query.assignedManagerId as string | undefined,
      categoryName: req.query.categoryName as string | undefined,
      stateName: req.query.stateName as string | undefined,
      companyName: req.query.companyName as string | undefined,
      priority: req.query.priority as 'BAJA' | 'MEDIA' | 'ALTA' | undefined,
      reportState: req.query.reportState as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | undefined
    };

    const reports = await reportsService.getReportsByNeighborhood(neighborhoodId, filters);

    res.json({
      success: true,
      message: 'Reportes del barrio obtenidos',
      data: {
        reports,
        count: reports.length,
        filters
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;

    const report = await reportsService.getReportById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Reporte obtenido',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      neighborhoodName: req.query.neighborhoodName as string | undefined,
      failureTypeName: req.query.failureTypeName as string | undefined,
      assignedManagerId: req.query.assignedManagerId as string | undefined,
      categoryName: req.query.categoryName as string | undefined,
      stateName: req.query.stateName as string | undefined,
      companyName: req.query.companyName as string | undefined,
      priority: req.query.priority as 'BAJA' | 'MEDIA' | 'ALTA' | undefined,
      reportState: req.query.reportState as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | undefined
    };

    const result = await reportsService.getAllReports(filters);

    res.json({
      success: true,
      message: 'Reportes obtenidos',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getReportsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de usuario es requerido'
      });
    }

    // Extraer filtros opcionales
    const filters = {
      neighborhoodName: req.query.neighborhoodName as string | undefined,
      failureTypeName: req.query.failureTypeName as string | undefined,
      categoryName: req.query.categoryName as string | undefined,
      stateName: req.query.stateName as string | undefined,
      companyName: req.query.companyName as string | undefined,
      priority: req.query.priority as 'BAJA' | 'MEDIA' | 'ALTA' | undefined,
      reportState: req.query.reportState as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | undefined
    };

    const reports = await reportsService.getReportsByUser(userId, filters);

    res.json({
      success: true,
      message: 'Reportes del usuario obtenidos',
      data: {
        reports,
        count: reports.length,
        filters
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignedReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Extraer filtros opcionales
    const filters = {
      neighborhoodName: req.query.neighborhoodName as string | undefined,
      failureTypeName: req.query.failureTypeName as string | undefined,
      categoryName: req.query.categoryName as string | undefined,
      stateName: req.query.stateName as string | undefined,
      companyName: req.query.companyName as string | undefined,
      priority: req.query.priority as 'BAJA' | 'MEDIA' | 'ALTA' | undefined,
      reportState: req.query.reportState as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | undefined
    };

    const reports = await reportsService.getAssignedReports(userId, filters);

    res.json({
      success: true,
      message: 'Reportes asignados obtenidos exitosamente',
      data: {
        reports,
        count: reports.length,
        filters
      }
    });
  } catch (error) {
    next(error);
  }
};


export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const { description, failureTypeId, urlPhoto } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const report = await reportsService.updateReport(reportId, userId, {
      description,
      failureTypeId,
      urlPhoto
    });

    res.json({
      success: true,
      message: 'Reporte actualizado exitosamente',
      data: { report }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const getAddressFromCoordinates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas'
      });
    }

    // Obtener dirección usando geocodificación inversa
    const addressData = await geocodingService.reverseGeocode({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    if (!addressData) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo obtener la dirección para estas coordenadas'
      });
    }

    res.json({
      success: true,
      message: 'Dirección obtenida exitosamente',
      data: {
        address: {
          formatted: addressData.formattedAddress,
          street: addressData.street,
          neighborhood: addressData.neighborhood,
          parish: addressData.parish,
          municipality: addressData.municipality,
          county: addressData.county,
          stateDistrict: addressData.stateDistrict,
          borough: addressData.borough,
          cityDistrict: addressData.cityDistrict,
          quarter: addressData.quarter,
          village: addressData.village,
          town: addressData.town,
          city: addressData.city,
          region: addressData.region,
          state: addressData.state,
          country: addressData.country,
          postalCode: addressData.postalCode,
          countryCode: addressData.countryCode
        }
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const { stateName } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!stateName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del estado es requerido'
      });
    }

    const report = await reportsService.updateReportStatus(reportId, userId, stateName);

    res.json({
      success: true,
      message: `Estado del reporte actualizado a ${stateName} exitosamente`,
      data: { report }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const assignWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const { workerId } = req.body;
    const managerId = req.user?.userId;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del trabajador es requerido'
      });
    }

    const report = await reportsService.assignWorker(reportId, workerId, managerId);

    res.json({
      success: true,
      message: 'Trabajador asignado exitosamente al reporte',
      data: { report }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;

    await reportsService.softDeleteReport(reportId);

    res.json({
      success: true,
      message: 'Reporte eliminado exitosamente (borrado lógico)'
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const hardDeleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;

    await reportsService.hardDeleteReport(reportId);

    res.json({
      success: true,
      message: 'Reporte eliminado permanentemente de la base de datos'
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
export const exportReportsToExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      neighborhoodName: req.body.neighborhoodName as string | undefined,
      failureTypeName: req.body.failureTypeName as string | undefined,
      assignedManagerId: req.body.assignedManagerId as string | undefined,
      categoryName: req.body.categoryName as string | undefined,
      stateName: req.body.stateName as string | undefined,
      companyName: req.body.companyName as string | undefined,
      priority: req.body.priority as 'BAJA' | 'MEDIA' | 'ALTA' | undefined,
      reportState: req.body.reportState as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | undefined
    };

    const reports = await reportsService.getReportsForExport(filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reportes de Averías');

    // Estilo para las cabeceras
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'DESCRIPCIÓN', key: 'description', width: 40 },
      { header: 'ESTADO', key: 'state', width: 15 },
      { header: 'PRIORIDAD', key: 'priority', width: 12 },
      { header: 'CATEGORÍA', key: 'category', width: 20 },
      { header: 'TIPO DE FALLA', key: 'failureType', width: 25 },
      { header: 'BARRIO', key: 'neighborhood', width: 25 },
      { header: 'EMPRESA', key: 'company', width: 25 },
      { header: 'TRABAJADOR ASIGNADO', key: 'manager', width: 30 },
      { header: 'REPORTADO POR', key: 'user', width: 30 },
      { header: 'DIRECCIÓN', key: 'address', width: 40 },
      { header: 'FECHA', key: 'date', width: 20 }
    ];

    // Aplicar estilos a la fila de cabecera
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };

    // Agregar datos
    reports.forEach((report: any) => {
      worksheet.addRow({
        id: report.id.substring(0, 8).toUpperCase(),
        description: report.description || 'Sin descripción',
        state: report.state?.name || 'N/A',
        priority: report.priority || 'N/A',
        category: report.category?.name || 'N/A',
        failureType: report.failureType?.name || 'N/A',
        neighborhood: report.neighborhood?.name || 'N/A',
        company: report.company?.name || 'N/A',
        manager: report.assignedManager ? `${report.assignedManager.name} ${report.assignedManager.lastname}` : 'Sin asignar',
        user: report.user ? `${report.user.name} ${report.user.lastname}` : 'N/A',
        address: report.address || 'N/A',
        date: new Date(report.createdAt).toLocaleString()
      });
    });

    // Configurar cabeceras de respuesta para descarga directa
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=reportes-averias.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const neighborhoodId = req.query.neighborhoodId
      ? parseInt(req.query.neighborhoodId as string, 10)
      : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ success: false, message: 'startDate inválida' });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: 'endDate inválida' });
    }
    if (neighborhoodId !== undefined && isNaN(neighborhoodId)) {
      return res.status(400).json({ success: false, message: 'neighborhoodId inválido' });
    }

    const { userId, role } = req.user!;
    const metrics = await reportsService.getMetrics(startDate, endDate, { role, userId }, categoryId, neighborhoodId);
    res.json({
      success: true,
      message: 'Métricas obtenidas exitosamente',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

export const getNeighborhoods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const neighborhoods = await reportsService.getNeighborhoods();
    res.json({ success: true, message: 'Barrios obtenidos', data: neighborhoods });
  } catch (error) {
    next(error);
  }
};

/**
 * Importar reportes desde archivo CSV
 */
export const importReportsFromCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Verificar que se envió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const isExcel = req.file.originalname.endsWith('.xlsx') || 
                    req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isCsv = req.file.originalname.endsWith('.csv') || 
                  req.file.mimetype === 'text/csv';

    if (!isExcel && !isCsv) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe ser de tipo CSV (.csv) o Excel (.xlsx)'
      });
    }

    // Obtener el companyId del usuario autenticado
    let userCompanyId: string | null = null;
    if (userRole === 'COMPANY') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      userCompanyId = user?.companyId || null;
    }

    // Leer contenido del archivo
    let csvContent = '';
    
    if (isExcel) {
      // Convertir Excel a CSV
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      csvContent = xlsx.utils.sheet_to_csv(worksheet);
    } else {
      // Leer CSV directamente
      csvContent = req.file.buffer.toString('utf-8');
    }
    // Importar reportes
    const result = await csvReportsImportService.importReportsFromCSV(csvContent, {
      userId,
      userRole: userRole || '',
      userCompanyId
    });

    // Respuesta
    const statusCode = result.created > 0 ? 201 : 400;
    res.status(statusCode).json({
      success: result.success,
      message: result.created > 0
        ? `Se importaron ${result.created} de ${result.total} reportes exitosamente`
        : 'No se pudo importar ningún reporte',
      data: {
        total: result.total,
        created: result.created,
        failed: result.failed,
        errors: result.errors,
        createdReports: result.createdReports
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Descargar plantilla CSV para importación de reportes
 */
export const downloadCSVTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = csvReportsImportService.generateTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-reportes.csv');
    res.send('\uFEFF' + template);
  } catch (error) {
    next(error);
  }
};

/**
 * Descargar plantilla Excel para importación de reportes
 */
export const downloadExcelTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buffer = csvReportsImportService.generateExcelTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-reportes.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
