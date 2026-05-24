import { Router } from 'express';
import {
  getAllCompanies,
  getCompanyById,
  getCompaniesByCategoryName,
  createCompany,
  updateCompany,
  deactivateCompany,
  getRelatedCitizens
} from './companies.controller';
import { validateCreateCompany, validateUpdateCompany } from './companies.validation';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Gestión de compañías
 */

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Obtener todas las compañías activas
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de compañías
 */
router.get('/', authenticateToken, getAllCompanies);

/**
 * @swagger
 * /api/companies/category/{categoryName}:
 *   get:
 *     summary: Obtener compañías pertenecientes a una categoria especifica
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compañías encontradas
 */
router.get('/category/:categoryName', authenticateToken, getCompaniesByCategoryName);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obtener compañía por ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Compañía encontrada
 */
router.get('/:id', authenticateToken, getCompanyById);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Crear una nueva compañía (Solo ADMIN)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               rif:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compañía creada
 */
router.post('/', authenticateToken, requireRole(['ADMIN']), validateCreateCompany, createCompany);

/**
 * @swagger
 * /api/companies/{id}:
 *   patch:
 *     summary: Actualizar compañía (Solo ADMIN)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               rif:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compañía actualizada
 */
router.patch('/:id', authenticateToken, requireRole(['ADMIN']), validateUpdateCompany, updateCompany);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Desactivar compañía (Solo ADMIN)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Compañía desactivada
 */
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deactivateCompany);

/**
 * @swagger
 * /api/companies/{id}/citizens:
 *   get:
 *     summary: Obtener ciudadanos relacionados con una compañía
 *     description: Retorna una lista de usuarios con rol 'citizen' que han creado reportes asignados a esta compañía.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la compañía
 *     responses:
 *       200:
 *         description: Lista de ciudadanos obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Compañía no encontrada
 */
router.get('/:id/citizens', authenticateToken, getRelatedCitizens);

export default router;
