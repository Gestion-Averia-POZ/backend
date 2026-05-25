/**
 * Servicio de importación de usuarios desde archivo CSV
 * 
 * Reglas de negocio:
 * - Solo se pueden importar usuarios con rol CITIZEN o WORKER
 * - ADMIN y COMPANY no se pueden importar vía CSV
 * - El email debe ser único (si existe, error en toda la importación)
 * - WORKER requiere companyName obligatorio
 * - Si el usuario autenticado es COMPANY, ignora companyName y usa su propia compañía
 * - Si el usuario autenticado es ADMIN, usa el companyName del CSV
 * - Transaccional: si hay error, no se importa nada
 */

import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import * as ExcelJS from 'exceljs';

export interface CSVUserImportResult {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  createdUsers: Array<{ id: string; name: string; email: string; role: string }>;
}

export interface CSVUserRow {
  name?: string;
  lastname?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  roleName?: string;
  companyName?: string;
  [key: string]: string | undefined;
}

interface ImportContext {
  userId: string;
  userRole: string;
  userCompanyId: string | null;
}

class CSVUsersImportService {
  
  /**
   * Parsear contenido CSV a array de objetos
   */
  private parseCSV(csvContent: string): CSVUserRow[] {
    const content = csvContent.replace(/^﻿/, '');
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }

    // Obtener encabezados
    const headers = this.parseCSVLine(lines[0]).map(h => h.trim());
    
    // Parsear filas
    const rows: CSVUserRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      const row: CSVUserRow = {};
      
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
   * Validar una fila del CSV
   */
  private validateRow(row: CSVUserRow, rowNumber: number, context: ImportContext): { valid: boolean; error?: string } {
    // Validar nombre
    if (!row.name || row.name.trim().length < 2) {
      return { valid: false, error: 'El nombre es requerido y debe tener al menos 2 caracteres' };
    }

    // Validar apellido
    if (!row.lastname || row.lastname.trim().length < 2) {
      return { valid: false, error: 'El apellido es requerido y debe tener al menos 2 caracteres' };
    }

    // Validar email
    if (!row.email) {
      return { valid: false, error: 'El email es requerido' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      return { valid: false, error: 'El email no tiene un formato válido' };
    }

    // Validar rol
    if (!row.roleName) {
      return { valid: false, error: 'El rol es requerido (roleName)' };
    }
    const roleNameUpper = row.roleName.toUpperCase();
    if (!['CITIZEN', 'WORKER'].includes(roleNameUpper)) {
      return { valid: false, error: `El rol "${row.roleName}" no es válido. Solo se permiten: CITIZEN o WORKER` };
    }

    // Validar compañía para WORKER
    if (roleNameUpper === 'WORKER') {
      // Si es COMPANY, usará su propia compañía
      if (context.userRole !== 'COMPANY' && !row.companyName) {
        return { valid: false, error: 'El campo companyName es requerido para usuarios WORKER' };
      }
    }

    // Validar teléfono si se proporciona
    if (row.phoneNumber && row.phoneNumber.trim().length > 0) {
      const phoneRegex = /^\+?58\s?\d{3}\s?\d{7}$/;
      const cleanPhone = row.phoneNumber.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone) && !/^\+?\d{10,15}$/.test(cleanPhone)) {
        return { valid: false, error: 'El teléfono no tiene un formato válido (ej: +58 414 1234567)' };
      }
    }

    return { valid: true };
  }

  /**
   * Importar usuarios desde un archivo CSV
   */
  async importUsersFromCSV(
    csvContent: string,
    context: ImportContext
  ): Promise<CSVUserImportResult> {
    const result: CSVUserImportResult = {
      success: false,
      total: 0,
      created: 0,
      failed: 0,
      errors: [],
      createdUsers: []
    };

    // Parsear CSV
    let rows: CSVUserRow[];
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

    // Obtener roles válidos
    const citizenRole = await prisma.role.findUnique({ where: { name: 'CITIZEN' } });
    const workerRole = await prisma.role.findUnique({ where: { name: 'WORKER' } });

    if (!citizenRole || !workerRole) {
      result.errors.push({ row: 0, error: 'Roles CITIZEN o WORKER no encontrados en la base de datos' });
      return result;
    }

    // Cache de compañías para ADMIN
    const companiesCache = new Map<string, string>();
    if (context.userRole === 'ADMIN') {
      const companies = await prisma.company.findMany({ where: { isActive: true } });
      companies.forEach(c => companiesCache.set(c.name.toUpperCase(), c.id));
    }

    // Validar todos los emails primero (verificar que no existan)
    const emailsToCheck = rows.map(r => r.email?.toLowerCase()).filter((e): e is string => !!e);
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: emailsToCheck } },
      select: { email: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Verificar emails duplicados dentro del mismo CSV
    const emailCounts = new Map<string, number>();
    for (const row of rows) {
      const email = row.email?.toLowerCase();
      if (email) {
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
      }
    }

    // Validar todas las filas antes de procesar
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      // Validar estructura de la fila
      const validation = this.validateRow(row, rowNumber, context);
      if (!validation.valid) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: validation.error! });
        continue;
      }

      // Verificar si el email ya existe en BD
      if (existingEmails.has(row.email!.toLowerCase())) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: `El email "${row.email}" ya existe en la base de datos` });
        continue;
      }

      // Verificar emails duplicados en el CSV
      if (emailCounts.get(row.email!.toLowerCase())! > 1) {
        result.failed++;
        result.errors.push({ row: rowNumber, error: `El email "${row.email}" está duplicado en el archivo CSV` });
        continue;
      }

      // Validar que la compañía exista (solo para ADMIN)
      if (context.userRole === 'ADMIN' && row.roleName?.toUpperCase() === 'WORKER' && row.companyName) {
        if (!companiesCache.has(row.companyName.toUpperCase())) {
          result.failed++;
          result.errors.push({ row: rowNumber, error: `La compañía "${row.companyName}" no existe en la base de datos` });
          continue;
        }
      }
    }

    // Si hay errores de validación, no continuar
    if (result.failed > 0) {
      return result;
    }

    // Hashear contraseñas secuencialmente para no saturar la CPU en archivos grandes
    const defaultPassword = await bcrypt.hash('123456', 10);
    const hashedPasswords: string[] = [];
    for (const row of rows) {
      hashedPasswords.push(row.password ? await bcrypt.hash(row.password, 10) : defaultPassword);
    }

    // Construir el array completo de usuarios a insertar
    const usersData = rows.map((row, i) => {
      const roleNameUpper = row.roleName!.toUpperCase();
      let companyId: string | null = null;
      if (roleNameUpper === 'WORKER') {
        if (context.userRole === 'COMPANY') {
          companyId = context.userCompanyId;
        } else if (row.companyName) {
          companyId = companiesCache.get(row.companyName.toUpperCase()) || null;
        }
      }
      return {
        name: row.name!.trim(),
        lastname: row.lastname!.trim(),
        email: row.email!.toLowerCase().trim(),
        password: hashedPasswords[i],
        phoneNumber: row.phoneNumber?.trim() || null,
        roleId: roleNameUpper === 'CITIZEN' ? citizenRole.id : workerRole.id,
        companyId,
        isActive: true,
      };
    });

    // Un solo INSERT masivo — sin loop dentro de la transacción
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({ data: usersData });
      });

      // Recuperar los usuarios creados para devolver sus IDs
      const insertedEmails = usersData.map(u => u.email);
      const created = await prisma.user.findMany({
        where: { email: { in: insertedEmails } },
        select: { id: true, name: true, email: true, role: { select: { name: true } } },
      });

      result.created = created.length;
      result.createdUsers = created.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name || 'SIN_ROL',
      }));
      result.success = result.created > 0;

    } catch (error) {
      result.created = 0;
      result.success = false;
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : 'Error al importar usuarios',
      });
    }

    return result;
  }

  /**
   * Generar plantilla CSV de ejemplo para usuarios
   */
  generateTemplate(): string {
    const headers = [
      'name',
      'lastname',
      'email',
      'phoneNumber',
      'password',
      'roleName',
      'companyName'
    ];

    const exampleRows = [
      ['José', 'González', 'jose.gonzalez@gmail.com', '+58 414 1234567', '', 'CITIZEN', ''],
      ['María', 'Rodríguez', 'maria.rodriguez@hotmail.com', '+58 424 2345678', '', 'WORKER', 'Hidrobolívar'],
      ['Carlos', 'Pérez', 'carlos.perez@outlook.com', '+58 416 3456789', '', 'WORKER', 'Corpoelec'],
      ['Ana', 'Martínez', 'ana.martinez@gmail.com', '', '', 'CITIZEN', ''],
      ['Luis', 'Hernández', 'luis.hernandez@yahoo.com', '+58 412 4567890', 'miPassword123', 'WORKER', 'Fospuca']
    ];

    const csvLines = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Generar plantilla Excel para usuarios
   */
  async generateExcelTemplate(): Promise<Buffer> {
    const headers = [
      'name',
      'lastname',
      'email',
      'phoneNumber',
      'password',
      'roleName',
      'companyName'
    ];

    const exampleRows = [
      ['José', 'González', 'jose.gonzalez@gmail.com', '+58 414 1234567', '', 'CITIZEN', ''],
      ['María', 'Rodríguez', 'maria.rodriguez@hotmail.com', '+58 424 2345678', '', 'WORKER', 'Hidrobolívar'],
      ['Carlos', 'Pérez', 'carlos.perez@outlook.com', '+58 416 3456789', '', 'WORKER', 'Corpoelec'],
      ['Ana', 'Martínez', 'ana.martinez@gmail.com', '', '', 'CITIZEN', ''],
      ['Luis', 'Hernández', 'luis.hernandez@yahoo.com', '+58 412 4567890', 'miPassword123', 'WORKER', 'Fospuca']
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');
    worksheet.addRow(headers);
    exampleRows.forEach(row => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export default new CSVUsersImportService();
