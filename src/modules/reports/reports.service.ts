import prisma from '../../config/prisma';
import geolocationService from '../../services/geolocation.service';

interface CreateReportData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  userId: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';
}

interface ReportsFilters {
  page?: number;
  limit?: number;
  neighborhoodName?: string;
  serviceName?: string;
  assignedManagerId?: string;
  categoryName?: string;
  stateName?: string;
  companyName?: string;
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';
  reportState?: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
}

class ReportsService {
  /**
   * Crear un reporte con detección automática de barrio
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

      // 2. Crear el reporte usando Prisma Raw Query (porque Prisma no soporta geometry)
      const reportId = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO report (
          id,
          title,
          description,
          location,
          category_id,
          user_id,
          neighborhood_id,
          priority,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${data.title},
          ${data.description},
          ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
          ${data.categoryId}::uuid,
          ${data.userId}::uuid,
          ${neighborhoodId},
          ${data.priority || 'MEDIA'},
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      // 3. Obtener el reporte creado con sus relaciones
      const createdReport = await prisma.report.findUnique({
        where: {
          id: reportId[0].id
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true
            }
          }
        }
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

    // Aplicar filtros por nombre usando relaciones
    if (filters?.serviceName) {
      where.service = {
        name: {
          contains: filters.serviceName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.assignedManagerId) {
      where.assignedManagerId = filters.assignedManagerId;
    }
    if (filters?.categoryName) {
      where.category = {
        name: {
          contains: filters.categoryName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.stateName) {
      where.state = {
        name: {
          contains: filters.stateName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.companyName) {
      where.company = {
        name: {
          contains: filters.companyName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.reportState) {
      where.state = {
        name: filters.reportState
      };
    }

    return await prisma.report.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        state: {
          select: {
            id: true,
            name: true,
            colorHex: true
          }
        },
        assignedManager: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        },
        neighborhood: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            lastname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Obtener un reporte por ID
   */
  async getReportById(reportId: string) {
    return await prisma.report.findFirst({
      where: {
        id: reportId,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        neighborhood: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Obtener todos los reportes (con paginación y filtros por nombre)
   */
  async getAllReports(filters: ReportsFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true
    };

    // Aplicar filtros por nombre usando relaciones
    if (filters.neighborhoodName) {
      where.neighborhood = {
        name: {
          contains: filters.neighborhoodName,
          mode: 'insensitive'
        }
      };
    }
    if (filters.serviceName) {
      where.service = {
        name: {
          contains: filters.serviceName,
          mode: 'insensitive'
        }
      };
    }
    if (filters.assignedManagerId) {
      where.assignedManagerId = filters.assignedManagerId;
    }
    if (filters.categoryName) {
      where.category = {
        name: {
          contains: filters.categoryName,
          mode: 'insensitive'
        }
      };
    }
    if (filters.stateName) {
      where.state = {
        name: {
          contains: filters.stateName,
          mode: 'insensitive'
        }
      };
    }
    if (filters.companyName) {
      where.company = {
        name: {
          contains: filters.companyName,
          mode: 'insensitive'
        }
      };
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.reportState) {
      where.state = {
        name: filters.reportState
      };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          service: {
            select: {
              id: true,
              name: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          },
          state: {
            select: {
              id: true,
              name: true,
              colorHex: true
            }
          },
          assignedManager: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true
            }
          },
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              lastname: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.report.count({
        where
      })
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        neighborhoodName: filters.neighborhoodName,
        serviceName: filters.serviceName,
        assignedManagerId: filters.assignedManagerId,
        categoryName: filters.categoryName,
        stateName: filters.stateName,
        companyName: filters.companyName,
        priority: filters.priority,
        reportState: filters.reportState
      }
    };
  }

  /**
   * Obtener reportes por usuario
   */
  async getReportsByUser(userId: string, filters?: Omit<ReportsFilters, 'page' | 'limit'>) {
    const where: any = {
      userId,
      isActive: true
    };

    // Aplicar filtros por nombre
    if (filters?.neighborhoodName) {
      where.neighborhood = {
        name: {
          contains: filters.neighborhoodName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.serviceName) {
      where.service = {
        name: {
          contains: filters.serviceName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.categoryName) {
      where.category = {
        name: {
          contains: filters.categoryName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.stateName) {
      where.state = {
        name: {
          contains: filters.stateName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.companyName) {
      where.company = {
        name: {
          contains: filters.companyName,
          mode: 'insensitive'
        }
      };
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.reportState) {
      where.state = {
        name: filters.reportState
      };
    }

    return await prisma.report.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        state: {
          select: {
            id: true,
            name: true,
            colorHex: true
          }
        },
        assignedManager: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        },
        neighborhood: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

export default new ReportsService();
