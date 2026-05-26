import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import csvUsersImportService from '../../services/csv-users-import.service';
import prisma from '../../config/prisma';
import * as ExcelJS from 'exceljs';

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.user?.userId;
    if (!creatorId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const employee = await usersService.createEmployee(req.body, creatorId);
    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: { employee }
    });
  } catch (error: any) {
    next(error);
  }
};

export const createCompanyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyUser = await usersService.createCompanyUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Usuario de empresa creado exitosamente',
      data: { companyUser }
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Importar usuarios desde archivo CSV
 */
export const importUsersFromCSV = async (req: Request, res: Response, next: NextFunction) => {
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
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(req.file.buffer as any);
      const ws = wb.worksheets[0];
      const rowsArr: string[][] = [];
      ws.eachRow((row) => {
        const cells = (row.values as ExcelJS.CellValue[]).slice(1).map((cell) => {
          if (cell === null || cell === undefined) return '';
          if (typeof cell === 'object' && 'text' in cell) return String((cell as any).text ?? '');
          return String(cell);
        });
        rowsArr.push(cells);
      });
      csvContent = rowsArr.map(r => r.join(',')).join('\n');
    } else {
      csvContent = req.file.buffer.toString('utf-8');
    }

    // Importar usuarios
    const result = await csvUsersImportService.importUsersFromCSV(csvContent, {
      userId,
      userRole: userRole || '',
      userCompanyId
    });

    // Respuesta
    const statusCode = result.created > 0 ? 201 : 400;
    res.status(statusCode).json({
      success: result.success,
      message: result.created > 0
        ? `Se importaron ${result.created} de ${result.total} usuarios exitosamente`
        : 'No se pudo importar ningún usuario',
      data: {
        total: result.total,
        created: result.created,
        failed: result.failed,
        errors: result.errors,
        createdUsers: result.createdUsers
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
 * Descargar plantilla CSV para importación de usuarios
 */
export const downloadUsersCSVTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = csvUsersImportService.generateTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-usuarios.csv');
    res.send('\uFEFF' + template);
  } catch (error) {
    next(error);
  }
};

/**
 * Descargar plantilla Excel para importación de usuarios
 */
export const downloadUsersExcelTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buffer = await csvUsersImportService.generateExcelTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-usuarios.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
