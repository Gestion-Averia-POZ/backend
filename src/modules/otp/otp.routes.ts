import { Router } from 'express';
import { sendRegisterOTP, sendResetPasswordOTP, verifyOTP, resetPassword, getOTPStatus, testEmailConnection } from './otp.controller';
import { validateSendOTP, validateVerifyOTP, validateResetPassword } from './otp.validation';

const router = Router();

/**
 * @swagger
 * /api/otp/send-register:
 *   post:
 *     summary: Enviar código OTP para registro
 *     description: Envía un código de verificación al email para registro de usuario
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 minLength: 5
 *                 maxLength: 40
 *                 example: juan.perez@example.com
 *                 description: Email del usuario (máximo 40 caracteres)
 *     responses:
 *       200:
 *         description: OTP enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email ya registrado o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Ya existe un código activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send-register', validateSendOTP, sendRegisterOTP);

/**
 * @swagger
 * /api/otp/send-reset-password:
 *   post:
 *     summary: Enviar código OTP para recuperar contraseña
 *     description: Envía un código de verificación al email para recuperación de contraseña
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 minLength: 5
 *                 maxLength: 40
 *                 example: juan.perez@example.com
 *                 description: Email del usuario registrado (máximo 40 caracteres)
 *     responses:
 *       200:
 *         description: OTP enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Email no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Ya existe un código activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send-reset-password', validateSendOTP, sendResetPasswordOTP);

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verificar código OTP
 *     description: Verifica un código OTP de 6 dígitos para registro o recuperación de contraseña
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, purpose]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 minLength: 5
 *                 maxLength: 40
 *                 example: juan.perez@example.com
 *                 description: Email del usuario (máximo 40 caracteres)
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: '123456'
 *                 description: Código OTP de 6 dígitos numéricos
 *               purpose:
 *                 type: string
 *                 enum: [register, reset-password]
 *                 example: register
 *                 description: 'Propósito del OTP: "register" para registro o "reset-password" para recuperación de contraseña'
 *     responses:
 *       200:
 *         description: OTP verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Código incorrecto o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Código no encontrado o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify', validateVerifyOTP, verifyOTP);

/**
 * @swagger
 * /api/otp/reset-password:
 *   post:
 *     summary: Cambiar contraseña usando código OTP
 *     description: Restablece la contraseña del usuario usando verificación OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 minLength: 5
 *                 maxLength: 40
 *                 example: juan.perez@example.com
 *                 description: Email del usuario (máximo 40 caracteres)
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: '123456'
 *                 description: Código OTP de 6 dígitos numéricos
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 25
 *                 example: NuevaPassword123
 *                 description: Nueva contraseña (entre 6 y 25 caracteres)
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Código incorrecto o contraseña inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Código no encontrado o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset-password', validateResetPassword, resetPassword);

/**
 * @swagger
 * /api/otp/status:
 *   get:
 *     summary: Consultar estado del OTP
 *     description: Obtiene información sobre el estado actual del OTP para un email y propósito específico
 *     tags: [OTP]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         example: usuario@example.com
 *         description: Email del usuario
 *       - in: query
 *         name: purpose
 *         required: true
 *         schema:
 *           type: string
 *           enum: [register, reset-password]
 *         example: register
 *         description: 'Propósito del OTP: "register" o "reset-password"'
 *     responses:
 *       200:
 *         description: Estado del OTP obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Parámetros faltantes o inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/status', getOTPStatus);

/**
 * @swagger
 * /api/otp/test-email:
 *   get:
 *     summary: Probar conexión de email
 *     description: Verifica que la configuración de email esté funcionando correctamente
 *     tags: [OTP]
 *     responses:
 *       200:
 *         description: Estado de la conexión de email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/test-email', testEmailConnection);

export default router;
