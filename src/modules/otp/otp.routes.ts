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
 *                 example: juan.perez@example.com
 *     responses:
 *       200:
 *         description: OTP enviado exitosamente
 *       400:
 *         description: Email ya registrado o datos inválidos
 *       429:
 *         description: Ya existe un código activo
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
 *                 example: juan.perez@example.com
 *     responses:
 *       200:
 *         description: OTP enviado exitosamente
 *       404:
 *         description: Email no encontrado
 *       429:
 *         description: Ya existe un código activo
 */
router.post('/send-reset-password', validateSendOTP, sendResetPasswordOTP);

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verificar código OTP
 *     description: Verifica un código OTP de 6 dígitos
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
 *                 example: juan.perez@example.com
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: '123456'
 *               purpose:
 *                 type: string
 *                 enum: [register, reset-password]
 *                 example: register
 *     responses:
 *       200:
 *         description: OTP verificado exitosamente
 *       400:
 *         description: Código incorrecto
 *       404:
 *         description: Código no encontrado o expirado
 */
router.post('/verify', validateVerifyOTP, verifyOTP);

/**
 * @swagger
 * /api/otp/reset-password:
 *   post:
 *     summary: Cambiar contraseña usando código OTP
 *     description: Restablece la contraseña del usuario
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
 *                 example: juan.perez@example.com
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: '123456'
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 25
 *                 example: NuevaPassword123
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Código incorrecto o contraseña inválida
 *       404:
 *         description: Código no encontrado o expirado
 */
router.post('/reset-password', validateResetPassword, resetPassword);

/**
 * @swagger
 * /api/otp/status:
 *   get:
 *     summary: Consultar estado del OTP
 *     description: Obtiene información sobre el estado actual del OTP
 *     tags: [OTP]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         example: usuario@example.com
 *       - in: query
 *         name: purpose
 *         required: true
 *         schema:
 *           type: string
 *           enum: [register, reset-password]
 *         example: register
 *     responses:
 *       200:
 *         description: Estado del OTP obtenido
 *       400:
 *         description: Parámetros inválidos
 */
router.get('/status', getOTPStatus);

/**
 * @swagger
 * /api/otp/test-email:
 *   get:
 *     summary: Probar conexión de email
 *     description: Verifica la configuración de email
 *     tags: [OTP]
 *     responses:
 *       200:
 *         description: Estado de la conexión
 */
router.get('/test-email', testEmailConnection);

export default router;
