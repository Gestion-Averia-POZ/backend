import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import geolocationService from '../../services/geolocation.service';

interface CreateReportData {
  description: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  userId: string;
  companyId?: string;
  failureTypeId?: number;
  assignedManagerId?: string;
  urlPhoto?: string;
  address?: string;
}

interface ReportsFilters {
  page?: number;
  limit?: number;
  neighborhoodName?: string;
  failureTypeName?: string;
  assignedManagerId?: string;
  categoryName?: string;
  stateName?: string;
  companyName?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';
  reportState?: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
}

// Include reutilizable para todos los queries de reporte
const REPORT_INCLUDE = {
  category:        { select: { id: true, name: true } },
  neighborhood:    { select: { id: true, name: true } },
  state:           { select: { id: true, name: true, colorHex: true } },
  company:         { select: { id: true, name: true } },
  failureType:     { select: { id: true, name: true, priority: true } },
  assignedManager: { select: { id: true, name: true, lastname: true, email: true } },
  user:            { select: { id: true, name: true, lastname: true, email: true } }
} as const;

class ReportsService {
  /**
   * Crear un reporte con detección automática de barrio y prioridad heredada del tipo de falla
   */
  async createReport(data: CreateReportData) {
    try {
      // 1. Detectar automáticamente el barrio basado en las coordenadas
      console.log(`🔍 Detectando barrio para coordenadas: ${data.latitude}, ${data.longitude}`);
      
      const neighborhoodId = await geolocationService.getNeighborhoodIdByPoint({
        latitude: data.latitude,
        longitude: data.longitude
      });

      if (!neighborhoodId) {
        throw new Error('No se pudo determinar el barrio para estas coordenadas. Verifica que estén dentro de un sector registrado.');
      }

      console.log(`✅ Barrio detectado con ID: ${neighborhoodId}`);

      // 2. Obtener automáticamente el estado PENDIENTE
      const pendingState = await prisma.state.findFirst({
        where: { name: 'PENDIENTE' },
        select: { id: true }
      });

      if (!pendingState) {
        throw new Error('Estado PENDIENTE no encontrado. Ejecuta el seed de la base de datos.');
      }

      // 3. Obtener la prioridad del tipo de falla (si fue especificado)
      let priority = 'MEDIA';
      if (data.failureTypeId) {
        const failureType = await prisma.failureType.findUnique({
          where: { id: data.failureTypeId },
          select: { priority: true }
        });
        if (failureType?.priority) {
          priority = failureType.priority;
          console.log(`🎯 Prioridad heredada del tipo de falla: ${priority}`);
        }
      }

      // 4. Crear el reporte usando Prisma Raw Query (porque Prisma no soporta geometry nativa)
      const reportId = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO report (
          id,
          description,
          location,
          address,
          category_id,
          user_id,
          neighborhood_id,
          state_id,
          company_id,
          failure_type_id,
          assigned_manager_id,
          url_photo,
          priority,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${data.description},
          ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
          ${data.address ?? null},
          CAST(${data.categoryId} AS UUID),
          CAST(${data.userId} AS UUID),
          ${neighborhoodId},
          ${pendingState.id},
          CAST(${data.companyId || null} AS UUID),
          ${data.failureTypeId || null},
          CAST(${data.assignedManagerId || null} AS UUID),
          ${data.urlPhoto ?? null},
          ${priority},
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      // 5. Obtener el reporte creado con todas sus relaciones
      const createdReport = await prisma.report.findUnique({
        where: { id: reportId[0].id },
        include: REPORT_INCLUDE
      });

      if (createdReport) {
        (createdReport as any).latitude = data.latitude;
        (createdReport as any).longitude = data.longitude;
      }

      return createdReport;
    } catch (error) {
      console.error('Error creando reporte:', error);
      throw error;
    }
  }

  /**
   * Obtener reportes por barrio (con filtros opcionales por nombre)
   */
  async getReportsByNeighborhood(neighborhoodId: string, filters?: Omit<ReportsFilters, 'neighborhoodName'>) {
    const where: any = {
      neighborhoodId: parseInt(neighborhoodId),
      isActive: true
    };

    this._applyFilters(where, filters);

    const reports = await prisma.report.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    return await this._attachCoordinates(reports);
  }

  /**
   * Obtener un reporte por ID (incluye historial de cambios)
   */
  async getReportById(reportId: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, isActive: true },
      include: {
        ...REPORT_INCLUDE,
        historyChanges: {
          orderBy: { createdAt: 'desc' },
          include: {
            user:             { select: { id: true, name: true, lastname: true } },
            previousStateRef: { select: { id: true, name: true, colorHex: true } },
            newStateRef:      { select: { id: true, name: true, colorHex: true } }
          }
        }
      }
    });

    return await this._attachCoordinates(report);
  }

  /**
   * Actualizar el estado de un reporte (y registrar en historial)
   */
  async updateReportStatus(reportId: string, userId: string, stateName: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, isActive: true },
      include: { state: { select: { id: true, name: true } } }
    });

    if (!report) throw new Error('Reporte no encontrado');
    
    if (report.state?.name === stateName) {
      return await this._attachCoordinates(report);
    }

    const newState = await prisma.state.findFirst({
      where: { name: stateName },
      select: { id: true }
    });

    if (!newState) {
      throw new Error(`Estado ${stateName} no encontrado.`);
    }

    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { stateId: newState.id },
        include: REPORT_INCLUDE
      }),
      prisma.historyChange.create({
        data: {
          reportId,
          userId,
          previousState: report.stateId ?? null,
          newState: newState.id,
          comment: `Estado actualizado a ${stateName}`
        }
      })
    ]);

    return await this._attachCoordinates(updatedReport);
  }

  /**
   * Asignar un trabajador a un reporte
   */
  async assignWorker(reportId: string, workerId: string, managerId: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, isActive: true }
    });

    if (!report) throw new Error('Reporte no encontrado');

    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      select: { id: true, name: true, lastname: true }
    });

    if (!worker) throw new Error('El trabajador especificado no existe');

    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { assignedManagerId: workerId },
        include: REPORT_INCLUDE
      }),
      prisma.historyChange.create({
        data: {
          reportId,
          userId: managerId,
          comment: `Trabajador asignado: ${worker.name} ${worker.lastname}`
        }
      })
    ]);

    return await this._attachCoordinates(updatedReport);
  }

  /**
   * Eliminar un reporte permanentemente si está cancelado o no tiene responsable asignado
   */
  async deleteReport(reportId: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId },
      include: { state: { select: { name: true } } }
    });

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    const isCancelled = report.state?.name === 'CANCELADO';
    const hasNoManager = !report.assignedManagerId;

    if (isCancelled || hasNoManager) {
      return await prisma.report.delete({
        where: { id: reportId }
      });
    }

    throw new Error('Solo se pueden eliminar reportes cancelados o sin responsable asignado');
  }


  /**
   * Obtener todos los reportes (con paginación y filtros por nombre)
   */
  async getAllReports(filters: ReportsFilters) {
    const page  = filters.page  || 1;
    const limit = filters.limit || 10;
    const skip  = (page - 1) * limit;

    const where: any = { isActive: true };
    this._applyFilters(where, filters);

    if (filters.neighborhoodName) {
      where.neighborhood = { name: { contains: filters.neighborhoodName, mode: 'insensitive' } };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: REPORT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ]);

    await this._attachCoordinates(reports);

    return {
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        neighborhoodName: filters.neighborhoodName,
        failureTypeName:  filters.failureTypeName,
        assignedManagerId: filters.assignedManagerId,
        categoryName: filters.categoryName,
        stateName:    filters.stateName,
        companyName:  filters.companyName,
        priority:     filters.priority,
        reportState:  filters.reportState
      }
    };
  }

  /**
   * Obtener reportes por usuario
   */
  async getReportsByUser(userId: string, filters?: Omit<ReportsFilters, 'page' | 'limit'>) {
    const where: any = { userId, isActive: true };
    this._applyFilters(where, filters);

    if (filters?.neighborhoodName) {
      where.neighborhood = { name: { contains: filters.neighborhoodName, mode: 'insensitive' } };
    }

    const reports = await prisma.report.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    return await this._attachCoordinates(reports);
  }

  /**
   * Obtener reportes asignados a un usuario específico
   */
  async getAssignedReports(managerId: string, filters?: Omit<ReportsFilters, 'page' | 'limit' | 'assignedManagerId'>) {
    const where: any = { assignedManagerId: managerId, isActive: true };
    this._applyFilters(where, filters);

    if (filters?.neighborhoodName) {
      where.neighborhood = { name: { contains: filters.neighborhoodName, mode: 'insensitive' } };
    }

    const reports = await prisma.report.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    return await this._attachCoordinates(reports);
  }


  /**
   * Aplica los filtros comunes al objeto where de Prisma
   */
  private _applyFilters(where: any, filters?: Partial<ReportsFilters>) {
    if (!filters) return;

    if (filters.failureTypeName) {
      where.failureType = { name: { contains: filters.failureTypeName, mode: 'insensitive' } };
    }
    if (filters.assignedManagerId) {
      where.assignedManagerId = filters.assignedManagerId;
    }
    if (filters.categoryName) {
      where.category = { name: { contains: filters.categoryName, mode: 'insensitive' } };
    }
    if (filters.stateName) {
      where.state = { name: { contains: filters.stateName, mode: 'insensitive' } };
    }
    if (filters.companyName) {
      where.company = { name: { contains: filters.companyName, mode: 'insensitive' } };
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.reportState) {
      where.state = { name: filters.reportState };
    }
  }

  /**
   * Extrae latitude y longitude de la columna location (geometry) y las adjunta a los reportes
   */
  private async _attachCoordinates(reports: any | any[]) {
    if (!reports) return reports;

    const isArray = Array.isArray(reports);
    if (isArray && reports.length === 0) return reports;

    const reportsArray = isArray ? reports : [reports];
    const reportIds = reportsArray.map(r => r.id);

    try {
      // Extraer coordenadas usando PostGIS (Casteamos id a text para evitar error de tipos con UUID)
      const coordinates = await prisma.$queryRaw<Array<{ id: string, latitude: number, longitude: number }>>`
        SELECT id, ST_Y(location) as latitude, ST_X(location) as longitude 
        FROM report 
        WHERE id::text IN (${Prisma.join(reportIds)})
      `;

      const coordsMap = new Map(coordinates.map(c => [c.id, { latitude: c.latitude, longitude: c.longitude }]));

      reportsArray.forEach(r => {
        const coords = coordsMap.get(r.id);
        if (coords) {
          r.latitude = coords.latitude;
          r.longitude = coords.longitude;
        }
      });
    } catch (error) {
      console.error('Error al extraer coordenadas:', error);
      // No bloqueamos la respuesta si falla la extracción, solo registramos el error
    }

    return reports;
  }
}

export default new ReportsService();
