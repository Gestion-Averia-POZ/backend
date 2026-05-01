import { Router } from 'express';
import { createEmployee, createCompanyUser } from './users.controller';
import { validateCreateEmployee, validateCreateCompanyUser } from './users.validation';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión administrativa de usuarios
 */

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
