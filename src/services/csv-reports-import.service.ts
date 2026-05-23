/**
 * Servicio de importación de reportes desde archivo CSV
 * 
 * Reglas de negocio:
 * - El usuario (userEmail) debe existir en la base de datos
 * - El sector (neighborhood) debe existir en la base de datos
 * - Si el usuario autenticado es COMPANY, ignora companyName y usa su propia compañía
 * - Si el usuario autenticado es ADMIN, usa el companyName del CSV
 * - Si no se proporcionan coordenadas, se generan automáticamente dentro del sector
 * - Transaccional: si hay error, no se importa nada
 */

import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export interface CSVReportImportResult {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  createdReports: Array<{ id: string; description: string; sector: string }>;
}

export interface CSVReportRow {
  description?: string;
  sector?: string;
  userEmail?: string;
  categoryName?: string;
  failureTypeName?: string;
  companyName?: string;
  address?: string;
  priority?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: string | undefined;
}

interface ImportContext {
  userId: string;
  userRole: string;
  userCompanyId: string | null;
}

class CSVReportsImportService {
  
  /**
   * Parsear contenido CSV a array de objetos
   */
  private parseCSV(csvContent: string): CSVReportRow[] {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }

    // Obtener encabezados
    const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    
    // Parsear filas
    const rows: CSVReportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      const row: CSVReportRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim();
      });
      
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Parsear una línea de CSV respetando comillas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Generar coordenadas aleatorias dentro de un polígono de barrio
   */
  private async generateRandomCoordinatesInNeighborhood(neighborhoodId: number): Promise<{ lat: number; lng: number } | null> {
    try {
      // Usar ST_Envelope para obtener los límites del polígono
      // y generar un punto aleatorio dentro de esos límites
      const result = await prisma.$queryRaw<Array<{ lat: number; lng: number }>>`
        SELECT 
          ST_Y(ST_GeneratePoints(geom, 1)) as lat,
          ST_X(ST_GeneratePoints(geom, 1)) as lng
        FROM neighborhood
        WHERE id = ${neighborhoodId}
        LIMIT 1
      `;

      if (result && result.length > 0) {
        return result[0];
      }

      // Alternativa: usar bounds del polígono si ST_GeneratePoints no funciona
      const bounds = await prisma.$queryRaw<Array<{ min_lat: number; max_lat: number; min_lng: number; max_lng: number }>>`
        SELECT 
          ST_YMin(geom) as min_lat,
          ST_YMax(geom) as max_lat,
          ST_XMin(geom) as min_lng,
          ST_XMax(geom) as max_lng
        FROM neighborhood
        WHERE id = ${neighborhoodId}
      `;

      if (bounds && bounds.length > 0) {
        const b = bounds[0];
        const lat = b.min_lat + Math.random() * (b.max_lat - b.min_lat);
        const lng = b.min_lng + Math.random() * (b.max_lng - b.min_lng);
        return { lat, lng };
      }

      return null;
    } catch (error) {
      console.error('Error generando coordenadas:', error);
      return null;
    }
  }

  /**
   * Validar una fila del CSV
   */
  private validateRow(row: CSVReportRow, rowNumber: number): { valid: boolean; error?: string } {
    // Validar descripción
    if (!row.description || row.description.trim().length < 10) {
      return { valid: false, error: 'La descripción es requerida y debe tener al menos 10 caracteres' };
    }

    // Validar sector
    if (!row.sector || row.sector.trim().length === 0) {
      return { valid: false, error: 'El sector (neighborhood) es requerido' };
    }

    // Validar email del usuario
    if (!row.userEmail || row.userEmail.trim().length === 0) {
      return { valid: false, error: 'El email del usuario (userEmail) es requerido' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.userEmail)) {
      return { valid: false, error: 'El email del usuario no tiene un formato válido' };
    }

    // Validar categoría
    if (!row.categoryName || row.categoryName.trim().length === 0) {
      return { valid: false, error: 'La categoría (categoryName) es requerida' };
    }

    // Validar coordenadas si se proporcionan
    if (row.latitude && row.longitude) {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return { valid: false, error: 'La latitud debe ser un número entre -90 y 90' };
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return { valid: false, error: 'La longitud debe ser un número entre -180 y 180' };
      }
    }

    // Validar prioridad si se proporciona
    if (row.priority) {
      const validPriorities = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
      if (!validPriorities.includes(row.priority.toUpperCase())) {
        return { valid: false, error: `La prioridad debe ser una de: ${validPriorities.join(', ')}` };
      }
    }

    return { valid: true };
  }

  /**
   * Importar reportes desde un archivo CSV
   */
  async importReportsFromCSV(
    csvContent: string,
    context: ImportContext
  ): Promise<CSVReportImportResult> {
    const result: CSVReportImportResult = {
      success: false,
      total: 0,
      created: 0,
      failed: 0,
      errors: [],
      createdReports: []
    };

    // Parsear CSV
    let rows: CSVReportRow[];
    try {
      rows = this.parseCSV(csvContent);
      result.total = rows.length;
    } catch (error) {
      result.errors.push({ row: 0, error: error instanceof Error ? error.message : 'Error parsing CSV' });
      return result;
    }

    if (rows.length === 0) {
      result.errors.push({ row: 0, error: 'El archivo CSV no contiene datos' });
      return result;
    }

    // Obtener estado pendiente
    const pendingState = await prisma.state.findFirst({ where: { name: 'PENDIENTE' } });
    if (!pendingState) {
      result.errors.push({ row: 0, error: 'Estado PENDIENTE no encontrado en la base de datos' });
      return result;
    }

    // Cache de categorías
    const categoriesCache = new Map<string, string>();
    const categories = await prisma.category.findMany({ where: { isActive: true } });
    categories.forEach(c => categoriesCache.set(c.name.toUpperCase(), c.id));

    // Cache de barrios/sectores
    const neighborhoodsCache = new Map<string, { id: number; name: string }>();
    const neighborhoods = await prisma.neighborhood.findMany();
    neighborhoods.forEach(n => neighborhoodsCache.set(n.name.toUpperCase(), { id: n.id, name: n.name }));

    // Cache de usuarios
    const usersCache = new Map<string, string>();
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true }
    });
    users.forEach(u => usersCache.set(u.email.toLowerCase(), u.id));

    // Cache de tipos de falla
    const failureTypesCache = new Map<string, { id: number; priority: string }>();
    const failureTypes = await prisma.failureType.findMany({
      where: { isActive: true },
      include: { category: true }
    });
    failureTypes.forEach(ft => {
      if (ft.category) {
        failureTypesCache.set(`${ft.category.name.toUpperCase()}_${ft.name.toUpperCase()}`, {
          id: ft.id,
          priority: ft.priority
        });
      }
    });

    // Cache de compañías (solo para ADMIN)
    const companiesCache = new Map<string, string>();
    if (context.userRole === 'ADMIN') {
      const companies = await prisma.company.findMany({ where: { isActive: true } });
      companies.forEach(c => companiesCache.set(c.name.toUpperCase(), c.id));
    }

    // Pre-validar todas las filas
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      // Validar estructura básica
      const validation = this.validateRow(row, rowNumber);
      if (!validation.valid) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: validation.error! });
        continue;
      }

      // Verificar que el usuario existe
      if (!usersCache.has(row.userEmail!.toLowerCase())) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: `El usuario con email "${row.userEmail}" no existe en la base de datos` });
        continue;
      }

      // Verificar que el sector existe
      if (!neighborhoodsCache.has(row.sector!.toUpperCase())) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: `El sector "${row.sector}" no existe en la base de datos` });
        continue;
      }

      // Verificar que la categoría existe
      if (!categoriesCache.has(row.categoryName!.toUpperCase())) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: `La categoría "${row.categoryName}" no existe en la base de datos` });
        continue;
      }

      // Verificar compañía (solo para ADMIN que especifica companyName)
      if (context.userRole === 'ADMIN' && row.companyName) {
        if (!companiesCache.has(row.companyName.toUpperCase())) {
          result.failed++;
          result.errors.push({ row: rowNumber, error: `La compañía "${row.companyName}" no existe en la base de datos` });
          continue;
        }
      }

      // Verificar tipo de falla si se especifica
      if (row.failureTypeName && row.categoryName) {
        const key = `${row.categoryName.toUpperCase()}_${row.failureTypeName.toUpperCase()}`;
        if (!failureTypesCache.has(key)) {
          // No es error, solo warning - continuamos sin tipo de falla
          console.warn(`Row ${rowNumber}: Tipo de falla "${row.failureTypeName}" no encontrado para categoría "${row.categoryName}"`);
        }
      }
    }

    // Si hay errores de validación, no continuar
    if (result.failed > 0) {
      return result;
    }

    // Usar transacción para importar todos los reportes
    try {
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 2;

          try {
            // Obtener IDs
            const userId = usersCache.get(row.userEmail!.toLowerCase())!;
            const categoryId = categoriesCache.get(row.categoryName!.toUpperCase())!;
            const neighborhood = neighborhoodsCache.get(row.sector!.toUpperCase())!;

            // Determinar coordenadas
            let latitude: number;
            let longitude: number;

            if (row.latitude && row.longitude) {
              latitude = parseFloat(row.latitude);
              longitude = parseFloat(row.longitude);
            } else {
              // Generar coordenadas aleatorias dentro del sector
              const coords = await this.generateRandomCoordinatesInNeighborhood(neighborhood.id);
              if (!coords) {
                throw new Error(`No se pudieron generar coordenadas para el sector "${row.sector}"`);
              }
              latitude = coords.lat;
              longitude = coords.lng;
            }

            // Determinar compañía
            let companyId: string | null = null;
            if (context.userRole === 'COMPANY') {
              // COMPANY usa su propia compañía
              companyId = context.userCompanyId;
            } else if (context.userRole === 'ADMIN' && row.companyName) {
              // ADMIN usa la compañía del CSV
              companyId = companiesCache.get(row.companyName.toUpperCase()) || null;
            }

            // Determinar tipo de falla y prioridad
            let failureTypeId: number | null = null;
            let priority = row.priority?.toUpperCase() || 'MEDIA';

            if (row.failureTypeName && row.categoryName) {
              const key = `${row.categoryName.toUpperCase()}_${row.failureTypeName.toUpperCase()}`;
              const ft = failureTypesCache.get(key);
              if (ft) {
                failureTypeId = ft.id;
                if (!row.priority) {
                  priority = ft.priority; // Heredar prioridad del tipo de falla
                }
              }
            }

            // Crear el reporte
            const reportId = await tx.$queryRaw<Array<{ id: string }>>`
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
                priority,
                is_active,
                created_at,
                updated_at
              ) VALUES (
                gen_random_uuid(),
                ${row.description},
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
                ${row.address || null},
                CAST(${categoryId} AS UUID),
                CAST(${userId} AS UUID),
                ${neighborhood.id},
                ${pendingState.id},
                CAST(${companyId} AS UUID),
                ${failureTypeId},
                ${priority},
                true,
                NOW(),
                NOW()
              )
              RETURNING id
            `;

            result.created++;
            result.createdReports.push({
              id: reportId[0].id,
              description: row.description!.substring(0, 50) + '...',
              sector: neighborhood.name
            });

          } catch (error) {
            result.failed++;
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : 'Error al crear reporte'
            });
            throw error; // Rollback de la transacción
          }
        }
      });

      result.success = result.created > 0;

    } catch (error) {
      // La transacción falló
      result.created = 0;
      result.success = false;
    }

    return result;
  }

  /**
   * Generar plantilla CSV de ejemplo para reportes
   */
  generateTemplate(): string {
    const headers = [
      'description',
      'sector',
      'userEmail',
      'categoryName',
      'failureTypeName',
      'companyName',
      'address',
      'priority',
      'latitude',
      'longitude'
    ];

    const exampleRows = [
      [
        'Hay una fuga de agua considerable en la esquina de la calle principal',
        'Villa Asia',
        'jose.gonzalez@gmail.com',
        'AGUA',
        'Fuga mayor en tubería principal',
        'Hidrobolívar',
        'Calle Principal',
        'ALTA',
        '',
        ''
      ],
      [
        'El transformador de la esquina está haciendo ruidos extraños y sale chispas',
        'Los Olivos',
        'maria.rodriguez@hotmail.com',
        'ELECTRICIDAD',
        'Falla en transformador',
        'Corpoelec',
        'Avenida Bolívar',
        'ALTA',
        '8.2760',
        '-62.7500'
      ],
      [
        'El camión de la basura no pasa desde hace 8 días y ya hay mal olor',
        'Los Mangos',
        'ana.martinez@gmail.com',
        'ASEO',
        'Sin recolección por más de una semana',
        'Fospuca',
        'Calle 5',
        'ALTA',
        '',
        ''
      ]
    ];

    const csvLines = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];

    return csvLines.join('\n');
  }
}

export default new CSVReportsImportService();
