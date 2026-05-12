import { Router } from 'express';
import {
  createReport,
  detectNeighborhood,
  getReportsByNeighborhood,
  getReportById,
  getAllReports,
  getAddressFromCoordinates,
  getReportsByUser,
  updateReport,
  updateReportStatus,
  assignWorker,
  getAssignedReports,
  deleteReport,
  hardDeleteReport,
  exportReportsToExcel,
  getMetrics,
  getNeighborhoods
} from './reports.controller';


import { validateCreateReport, validateDetectNeighborhood, validateReportsFilters } from './reports.validation';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/reports/metrics:
 *   get:
 *     summary: Obtener métricas clave para el dashboard
 *     description: Retorna estadísticas sobre estados, tipos de falla, prioridad, tasa de resolución y sectores críticos.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *       403:
 *         description: No tiene permisos suficientes (Requiere ADMIN, COMPANY o WORKER)
 */
router.get('/metrics', authenticateToken, requireRole(['ADMIN', 'COMPANY', 'WORKER']), getMetrics);
router.get('/neighborhoods', authenticateToken, getNeighborhoods);

/**
 * @swagger
 * /api/reports/export:
 *   post:
 *     summary: Exportar reportes a Excel
 *     description: Genera un archivo .xlsx con los reportes filtrados. Descarga directa.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               neighborhoodName: { type: string }
 *               reportState: { type: string, enum: [PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO] }
 *               priority: { type: string, enum: [BAJA, MEDIA, ALTA] }
 *     responses:
 *       200:
 *         description: Archivo Excel generado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/export', authenticateToken, requireRole(['ADMIN', 'COMPANY', 'WORKER']), exportReportsToExcel);


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
 * /api/reports/{reportId}/status:
 *   patch:
 *     summary: Actualizar el estado de un reporte
 *     description: Cambia el estado de un reporte a cualquier estado válido (PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO) y registra el cambio en el historial
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
 *         description: ID del reporte a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stateName
 *             properties:
 *               stateName:
 *                 type: string
 *                 enum: [PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO]
 *                 example: EN_PROCESO
 *                 description: Nombre del nuevo estado
 *     responses:
 *       200:
 *         description: Estado del reporte actualizado exitosamente
 *       400:
 *         description: El estado no existe o el reporte no existe
 *       401:
 *         description: No autenticado
 */
router.patch('/:reportId/status', authenticateToken, updateReportStatus);

/**
 * @swagger
 * /api/reports/{reportId}/assign:
 *   patch:
 *     summary: Asignar un trabajador a un reporte
 *     description: Permite a una empresa asignar un usuario (worker) para atender el reporte
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
 *         description: ID del reporte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerId
 *             properties:
 *               workerId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: ID del usuario (worker) a asignar
 *     responses:
 *       200:
 *         description: Trabajador asignado exitosamente
 *       400:
 *         description: El trabajador no existe o el reporte no existe
 *       401:
 *         description: No autenticado
 */
router.patch('/:reportId/assign', authenticateToken, assignWorker);

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
 *   patch:
 *     summary: Actualizar campos básicos de un reporte
 *     description: Permite editar solo la descripción, el tipo de falla y la URL de la foto. Otros campos como categoría, empresa o ubicación no son editables una vez creado el reporte.
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
 *         description: ID del reporte a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Se ha agravado la fuga, ahora sale más agua"
 *               failureTypeId:
 *                 type: integer
 *                 example: 2
 *               urlPhoto:
 *                 type: string
 *                 format: uri
 *                 example: "https://bucket.com/photo.jpg"
 *     responses:
 *       200:
 *         description: Reporte actualizado exitosamente
 *       400:
 *         description: Datos inválidos o reporte no encontrado
 *       401:
 *         description: No autenticado
 */
router.patch('/:reportId', authenticateToken, updateReport);

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
 * /api/reports/{reportId}:
 *   delete:
 *     summary: Eliminar un reporte (SoftDelete)
 *     description: Cambia el estado isActive a false para que el reporte ya no sea visible en las listas generales, pero permanece en la base de datos.
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
 *         description: Reporte ocultado exitosamente
 *       404:
 *         description: Reporte no encontrado
 */
router.delete('/:reportId', authenticateToken, deleteReport);

/**
 * @swagger
 * /api/reports/{reportId}/hard:
 *   delete:
 *     summary: Eliminar un reporte permanentemente (Hard Delete)
 *     description: Borra el registro físicamente de la base de datos. Solo permitido si el reporte está CANCELADO o no tiene responsable.
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
 *         description: Reporte eliminado permanentemente
 *       400:
 *         description: No cumple las condiciones para ser eliminado físicamente
 */
router.delete('/:reportId/hard', authenticateToken, hardDeleteReport);

export default router;


