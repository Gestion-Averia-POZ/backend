import { Router } from 'express';
import { createEmployee, createCompanyUser, importUsersFromCSV, downloadUsersCSVTemplate } from './users.controller';
import { validateCreateEmployee, validateCreateCompanyUser } from './users.validation';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import multer from 'multer';

// Configurar multer para upload de archivos CSV
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión administrativa de usuarios
 */

/**
 * @swagger
 * /api/users/import/template:
 *   get:
 *     summary: Descargar plantilla CSV para importación de usuarios
 *     description: Descarga una plantilla CSV con el formato correcto para importar usuarios (CITIZEN y WORKER)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo CSV plantilla
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/import/template', authenticateToken, requireRole(['ADMIN', 'COMPANY']), downloadUsersCSVTemplate);

/**
 * @swagger
 * /api/users/import:
 *   post:
 *     summary: Importar usuarios desde archivo CSV
 *     description: |
 *       Permite importar múltiples usuarios desde un archivo CSV.
 *       - Solo se pueden importar usuarios con rol CITIZEN o WORKER
 *       - ADMIN puede asignar usuarios a cualquier compañía
 *       - COMPANY solo puede asignar usuarios a su propia compañía
 *       
 *       Columnas requeridas: name, lastname, email, roleName
 *       Columnas opcionales: phoneNumber, password, companyName
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo CSV con los usuarios a importar
 *     responses:
 *       201:
 *         description: Usuarios importados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     created:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row: { type: number }
 *                           error: { type: string }
 *                     createdUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           email: { type: string }
 *                           role: { type: string }
 *       400:
 *         description: Error en el archivo o datos inválidos
 */
router.post('/import', authenticateToken, requireRole(['ADMIN', 'COMPANY']), upload.single('file'), importUsersFromCSV);

/**
 * @swagger
 * /api/users/employee:
 *   post:
 *     summary: Crear un nuevo empleado (WORKER)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastname, email, password]
 *             properties:
 *               name: { type: string }
 *               lastname: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phoneNumber: { type: string }
 *     responses:
 *       201:
 *         description: Empleado creado exitosamente
 */
router.post('/employee', authenticateToken, requireRole(['COMPANY']), validateCreateEmployee, createEmployee);

/**
 * @swagger
 * /api/users/company:
 *   post:
 *     summary: Crear un nuevo usuario de empresa (COMPANY)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastname, email, password, companyId]
 *             properties:
 *               name: { type: string }
 *               lastname: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phoneNumber: { type: string }
 *               companyId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Usuario de empresa creado exitosamente
 */
router.post('/company', authenticateToken, requireRole(['ADMIN']), validateCreateCompanyUser, createCompanyUser);

export default router;
