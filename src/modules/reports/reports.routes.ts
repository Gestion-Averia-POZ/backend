import { Router } from 'express';
import {
  createReport,
  detectNeighborhood,
  getReportsByNeighborhood,
  getReportById,
  getAllReports,
  getAddressFromCoordinates,
  getReportsByUser,
  cancelReport,
  getAssignedReports,
  deleteReport
} from './reports.controller';


import { validateCreateReport, validateDetectNeighborhood, validateReportsFilters } from './reports.validation';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/reports/detect-neighborhood:
 *   post:
 *     summary: Detectar barrio automáticamente por coordenadas GPS
 *     description: Usa ST_Contains de PostGIS para determinar en qué barrio se encuentra un punto
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 8.2889
 *               longitude:
 *                 type: number
 *                 example: -62.7394
 *     responses:
 *       200:
 *         description: Barrio detectado exitosamente
 *       404:
 *         description: No se encontró ningún barrio
 *       401:
 *         description: No autenticado
 */
router.post('/detect-neighborhood', authenticateToken, validateDetectNeighborhood, detectNeighborhood);

/**
 * @swagger
 * /api/reports/get-address:
 *   post:
 *     summary: Obtener dirección desde coordenadas GPS (Geocodificación Inversa)
 *     description: Convierte coordenadas GPS en una dirección legible usando OpenStreetMap
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 8.2889
 *                 description: Latitud GPS
 *               longitude:
 *                 type: number
 *                 example: -62.7394
 *                 description: Longitud GPS
 *     responses:
 *       200:
 *         description: Dirección obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dirección obtenida exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *                       properties:
 *                         formatted:
 *                           type: string
 *                           example: Avenida Principal #123, Villa Asia, Puerto Ordaz, Bolívar
 *                         street:
 *                           type: string
 *                           example: Avenida Principal #123
 *                         neighborhood:
 *                           type: string
 *                           example: Villa Asia
 *                         parish:
 *                           type: string
 *                           example: Unare
 *                           description: Parroquia (quarter o city_district)
 *                         municipality:
 *                           type: string
 *                           example: Caroní
 *                           description: Municipio
 *                         county:
 *                           type: string
 *                           example: Caroní
 *                         stateDistrict:
 *                           type: string
 *                           example: Distrito Caroní
 *                         borough:
 *                           type: string
 *                           example: Puerto Ordaz
 *                         cityDistrict:
 *                           type: string
 *                           example: Unare
 *                         quarter:
 *                           type: string
 *                           example: Unare II
 *                         village:
 *                           type: string
 *                           example: Villa Asia
 *                         town:
 *                           type: string
 *                           example: Puerto Ordaz
 *                         city:
 *                           type: string
 *                           example: Puerto Ordaz
 *                         region:
 *                           type: string
 *                           example: Guayana
 *                         state:
 *                           type: string
 *                           example: Bolívar
 *                         country:
 *                           type: string
 *                           example: Venezuela
 *                         postalCode:
 *                           type: string
 *                           example: 8050
 *                         countryCode:
 *                           type: string
 *                           example: ve
 *       404:
 *         description: No se pudo obtener la dirección
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado
 */
router.post('/get-address', authenticateToken, validateDetectNeighborhood, getAddressFromCoordinates);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Crear un nuevo reporte con detección automática de barrio
 *     description: Crea un reporte y detecta automáticamente el barrio usando las coordenadas GPS. El estado se asigna a PENDIENTE automáticamente.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - latitude
 *               - longitude
 *               - categoryId
 *             properties:
 *               description:
 *                 type: string
 *                 example: Hay una fuga de agua considerable en la esquina
 *               latitude:
 *                 type: number
 *                 example: 8.2889
 *               longitude:
 *                 type: number
 *                 example: -62.7394
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la categoría del reporte
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la empresa responsable (opcional)
 *               failureTypeId:
 *                 type: integer
 *                 description: ID del tipo de falla/avería (opcional)
 *               assignedManagerId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del responsable asignado (opcional)
 *               urlPhoto:
 *                 type: string
 *                 format: uri
 *                 description: URL de la imagen del reporte (opcional)
 *               address:
 *                 type: string
 *                 example: Avenida Principal #123, Villa Asia
 *                 description: Dirección opcional del reporte
 *     responses:
 *       201:
 *         description: Reporte creado exitosamente con estado PENDIENTE
 *       401:
 *         description: No autenticado
 */
router.post('/', authenticateToken, validateCreateReport, createReport);

/**
 * @swagger
 * /api/reports/cancel/{reportId}:
 *   patch:
 *     summary: Cancelar un reporte
 *     description: Cambia el estado de un reporte a CANCELADO y registra el cambio en el historial
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del reporte a cancelar
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 example: El problema fue resuelto antes de atenderlo
 *                 description: Comentario opcional sobre la cancelación
 *     responses:
 *       200:
 *         description: Reporte cancelado exitosamente
 *       400:
 *         description: El reporte ya está cancelado o no existe
 *       401:
 *         description: No autenticado
 */
router.patch('/cancel/:reportId', authenticateToken, cancelReport);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obtener todos los reportes (con paginación y filtros por nombre)
 *     description: Lista todos los reportes con soporte para filtros múltiples por nombre
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Cantidad de reportes por página
 *       - in: query
 *         name: neighborhoodName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de sector/barrio (búsqueda parcial)
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de servicio (búsqueda parcial)
 *       - in: query
 *         name: assignedManagerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de persona asignada
 *       - in: query
 *         name: categoryName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de categoría (búsqueda parcial)
 *       - in: query
 *         name: stateName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de estado (búsqueda parcial)
 *       - in: query
 *         name: companyName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de empresa (búsqueda parcial)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: reportState
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO]
 *         description: Filtrar por estado del reporte
 *     responses:
 *       200:
 *         description: Reportes obtenidos exitosamente
 *       401:
 *         description: No autenticado
 */
router.get('/', authenticateToken, validateReportsFilters, getAllReports);

/**
 * @swagger
 * /api/reports/user/{userId}:
 *   get:
 *     summary: Obtener reportes de un usuario específico
 *     description: Lista todos los reportes creados por un usuario específico con filtros opcionales
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *       - in: query
 *         name: neighborhoodName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de sector/barrio
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de servicio
 *       - in: query
 *         name: categoryName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de categoría
 *       - in: query
 *         name: stateName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de estado
 *       - in: query
 *         name: companyName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de empresa
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: reportState
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO]
 *         description: Filtrar por estado del reporte
 *     responses:
 *       200:
 *         description: Reportes del usuario obtenidos
 *       401:
 *         description: No autenticado
 */
router.get('/user/:userId', authenticateToken, getReportsByUser);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     summary: Obtener un reporte por ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reporte obtenido
 *       404:
 *         description: Reporte no encontrado
 *       401:
 *         description: No autenticado
 */
router.get('/:reportId', authenticateToken, getReportById);

/**
 * @swagger
 * /api/reports/neighborhood/{neighborhoodId}:
 *   get:
 *     summary: Obtener reportes de un barrio específico (con filtros por nombre)
 *     description: Lista reportes de un barrio con soporte para filtros adicionales por nombre
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: neighborhoodId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID del barrio/sector
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de servicio
 *       - in: query
 *         name: assignedManagerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de persona asignada
 *       - in: query
 *         name: categoryName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de categoría
 *       - in: query
 *         name: stateName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de estado
 *       - in: query
 *         name: companyName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de empresa
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: reportState
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO]
 *         description: Filtrar por estado del reporte
 *     responses:
 *       200:
 *         description: Reportes del barrio obtenidos
 *       401:
 *         description: No autenticado
 */
router.get('/neighborhood/:neighborhoodId', authenticateToken, getReportsByNeighborhood);

/**
 * @swagger
 * /api/reports/assigned:
 *   get:
 *     summary: Obtener reportes asignados al usuario autenticado
 *     description: Lista todos los reportes donde el usuario actual es el responsable asignado
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: neighborhoodName
 *         schema: { type: string }
 *       - in: query
 *         name: categoryName
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [BAJA, MEDIA, ALTA] }
 *       - in: query
 *         name: reportState
 *         schema: { type: string, enum: [PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO] }
 *     responses:
 *       200:
 *         description: Reportes asignados obtenidos
 */
router.get('/assigned', authenticateToken, getAssignedReports);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   delete:
 *     summary: Eliminar un reporte permanentemente
 *     description: Solo permite eliminar si el reporte está CANCELADO o si no tiene un responsable asignado.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reporte eliminado exitosamente
 *       400:
 *         description: No cumple las condiciones para ser eliminado
 */
router.delete('/:reportId', authenticateToken, deleteReport);

export default router;


