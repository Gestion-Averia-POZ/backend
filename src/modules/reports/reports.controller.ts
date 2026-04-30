import { Request, Response, NextFunction } from 'express';
import reportsService from './reports.service';
import geolocationService from '../../services/geolocation.service';
import geocodingService from '../../services/geocoding.service';

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, latitude, longitude, categoryId, companyId, failureTypeId, assignedManagerId, urlPhoto } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const report = await reportsService.createReport({
      description, latitude, longitude, categoryId, userId,
      companyId, failureTypeId, assignedManagerId, urlPhoto
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

export const cancelReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const report = await reportsService.cancelReport(reportId, userId, comment);

    res.json({
      success: true,
      message: 'Reporte cancelado exitosamente',
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
