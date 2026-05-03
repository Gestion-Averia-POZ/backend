import { Router } from 'express';
import {
  createRequest,
  createPublicRequest,
  getAllRequests,
  getRequestById,
  getRequestsByUser,
  updateRequestState,
  deleteRequest
} from './requests.controller';
import {
  validateCreateRequest,
  validatePublicCreateRequest,
  validateUpdateRequestState
} from './requests.validation';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Gestión de solicitudes (Registro, Duda, Bug)
 */

/**
 * @swagger
 * /api/requests/public:
 *   post:
 *     summary: Crear una nueva solicitud de REGISTRO (Público)
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicantName, description]
 *             properties:
 *               applicantName: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Solicitud de registro creada
 */
router.post('/public', validatePublicCreateRequest, createPublicRequest);

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Crear una nueva solicitud (Autenticado)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicantName, type, description]
 *             properties:
 *               applicantName: { type: string }
 *               type: { type: string, enum: [REGISTRO, DUDA, BUG] }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Solicitud creada
 */
router.post('/', authenticateToken, validateCreateRequest, createRequest);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Obtener todas las solicitudes (Solo ADMIN)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 */
router.get('/', authenticateToken, requireRole(['ADMIN']), getAllRequests);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Obtener una solicitud por ID (Solo ADMIN)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Datos de la solicitud
 */
router.get('/:id', authenticateToken, requireRole(['ADMIN']), getRequestById);

/**
 * @swagger
 * /api/requests/user/{userId}:
 *   get:
 *     summary: Obtener todas las solicitudes creadas por un usuario
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de solicitudes del usuario
 */
router.get('/user/:userId', authenticateToken, getRequestsByUser);

/**
 * @swagger
 * /api/requests/{id}/state:
 *   patch:
 *     summary: Actualizar el estado de una solicitud (Solo ADMIN)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [state]
 *             properties:
 *               state: { type: string, enum: [EN_PROCESO, COMPLETADO, CANCELADO] }
 *     responses:
 *       200:
 *         description: Solicitud actualizada
 */
router.patch('/:id/state', authenticateToken, requireRole(['ADMIN']), validateUpdateRequestState, updateRequestState);

/**
 * @swagger
 * /api/requests/{id}:
 *   delete:
 *     summary: Eliminar una solicitud (Solo ADMIN)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Solicitud eliminada
 */
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteRequest);

export default router;
