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

    return await prisma.report.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener un reporte por ID (incluye historial de cambios)
   */
  async getReportById(reportId: string) {
    return await prisma.report.findFirst({
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
  }

  /**
   * Cancelar un reporte (cambiar estado a CANCELADO y registrar en historial)
   */
  async cancelReport(reportId: string, userId: string, comment?: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, isActive: true },
      include: { state: { select: { id: true, name: true } } }
    });

    if (!report) throw new Error('Reporte no encontrado');
    if (report.state?.name === 'CANCELADO') throw new Error('El reporte ya está cancelado');

    const cancelledState = await prisma.state.findFirst({
      where: { name: 'CANCELADO' },
      select: { id: true }
    });

    if (!cancelledState) {
      throw new Error('Estado CANCELADO no encontrado.');
    }

    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { stateId: cancelledState.id },
        include: REPORT_INCLUDE
      }),
      prisma.historyChange.create({
        data: {
          reportId,
          userId,
          previousState: report.stateId ?? null,
          newState: cancelledState.id,
          comment: comment ?? 'Reporte cancelado'
        }
      })
    ]);

    return updatedReport;
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

    return await prisma.report.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
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
}

export default new ReportsService();
