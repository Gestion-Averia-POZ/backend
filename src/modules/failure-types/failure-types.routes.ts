import { Router } from 'express';
import {
  getAllFailureTypes,
  getFailureTypeById,
  getFailureTypesByCategory,
  createFailureType,
  updateFailureType,
  deactivateFailureType
} from './failure-types.controller';
import {
  validateCreateFailureType,
  validateUpdateFailureType
} from './failure-types.validation';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FailureTypes
 *   description: Gestión de tipos de falla / averías
 */

/**
 * @swagger
 * /api/failure-types:
 *   get:
 *     summary: Obtener todos los tipos de falla activos
 *     tags: [FailureTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de falla
 */
router.get('/', authenticateToken, getAllFailureTypes);

/**
 * @swagger
 * /api/failure-types/category/{categoryId}:
 *   get:
 *     summary: Obtener tipos de falla por ID de categoría
 *     tags: [FailureTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tipos de falla encontrados
 */
router.get('/category/:categoryId', authenticateToken, getFailureTypesByCategory);

/**
 * @swagger
 * /api/failure-types/{id}:
 *   get:
 *     summary: Obtener tipo de falla por ID
 *     tags: [FailureTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tipo de falla encontrado
 */
router.get('/:id', authenticateToken, getFailureTypeById);

/**
 * @swagger
 * /api/failure-types:
 *   post:
 *     summary: Crear un nuevo tipo de falla (Solo ADMIN)
 *     tags: [FailureTypes]
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
 *               priority:
 *                 type: string
 *                 enum: [BAJA, MEDIA, ALTA, CRITICA]
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Tipo de falla creado
 */
router.post('/', authenticateToken, requireRole(['ADMIN']), validateCreateFailureType, createFailureType);

/**
 * @swagger
 * /api/failure-types/{id}:
 *   patch:
 *     summary: Actualizar tipo de falla (Solo ADMIN)
 *     tags: [FailureTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               priority:
 *                 type: string
 *                 enum: [BAJA, MEDIA, ALTA, CRITICA]
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de falla actualizado
 */
router.patch('/:id', authenticateToken, requireRole(['ADMIN']), validateUpdateFailureType, updateFailureType);

/**
 * @swagger
 * /api/failure-types/{id}:
 *   delete:
 *     summary: Desactivar tipo de falla (Solo ADMIN)
 *     tags: [FailureTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tipo de falla desactivado
 */
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deactivateFailureType);

export default router;
