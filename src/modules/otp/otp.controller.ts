import { Request, Response, NextFunction } from 'express';
import otpService from './otp.service';
import authService from '../auth/auth.service';
import emailService from '../../services/email.service';

// Cache para evitar consultas repetidas de verificación de email
const emailCheckCache = new Map<string, { exists: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Función helper para verificar email con cache
const checkEmailWithCache = async (email: string): Promise<boolean> => {
  const cached = emailCheckCache.get(email);
  const now = Date.now();
  
  // Si está en cache y no ha expirado, usar valor cacheado
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.exists;
  }
  
  // Verificar en base de datos
  const exists = await authService.checkEmailExists(email);
  
  // Guardar en cache
  emailCheckCache.set(email, { exists, timestamp: now });
  
  // Limpiar cache periódicamente (evitar memory leaks)
  if (emailCheckCache.size > 1000) {
    const cutoff = now - CACHE_TTL;
    for (const [key, value] of emailCheckCache.entries()) {
      if (value.timestamp < cutoff) {
        emailCheckCache.delete(key);
      }
    }
  }
  
  return exists;
};

export const sendRegisterOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    // Verificar si el email ya está registrado (con cache)
    const emailExists = await checkEmailWithCache(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Enviar OTP
    await otpService.sendOTP(email, 'register');

    res.json({
      success: true,
      message: 'Código de verificación enviado al email',
      data: {
        email,
        expiresIn: '10 minutos'
      }
    });
  } catch (error) {
    // Manejar errores específicos de OTP
    if (error instanceof Error && error.message.includes('Ya tienes un código activo')) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const sendResetPasswordOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    // Verificar si el email existe (con cache)
    const emailExists = await checkEmailWithCache(email);
    if (!emailExists) {
      return res.status(404).json({
        success: false,
        message: 'El email no está registrado'
      });
    }

    // Enviar OTP
    await otpService.sendOTP(email, 'reset-password');

    res.json({
      success: true,
      message: 'Código de recuperación enviado al email',
      data: {
        email,
        expiresIn: '10 minutos'
      }
    });
  } catch (error) {
    // Manejar errores específicos de OTP
    if (error instanceof Error && error.message.includes('Ya tienes un código activo')) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, purpose } = req.body;

    // Verificar OTP
    const isValid = await otpService.verifyOTP(email, code, purpose);

    if (isValid) {
      res.json({
        success: true,
        message: 'Código verificado correctamente',
        data: {
          email,
          purpose,
          verified: true
        }
      });
    }
  } catch (error) {
    // Manejar errores específicos de OTP
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('no encontrado') || message.includes('expirado')) {
        return res.status(404).json({
          success: false,
          message
        });
      }
      
      if (message.includes('Máximo número de intentos') || message.includes('Código incorrecto')) {
        return res.status(400).json({
          success: false,
          message
        });
      }
    }
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, newPassword } = req.body;

    // Verificar OTP primero
    const isValid = await otpService.verifyOTP(email, code, 'reset-password');
    
    if (isValid) {
      // Cambiar contraseña
      await authService.resetPassword(email, newPassword);
      
      // Limpiar cache del email
      emailCheckCache.delete(email);

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    }
  } catch (error) {
    // Manejar errores específicos
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('no encontrado') || message.includes('expirado')) {
        return res.status(404).json({
          success: false,
          message: 'Código OTP inválido o expirado'
        });
      }
      
      if (message.includes('Máximo número de intentos') || message.includes('Código incorrecto')) {
        return res.status(400).json({
          success: false,
          message
        });
      }
    }
    next(error);
  }
};

export const getOTPStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, purpose } = req.query;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email y propósito son requeridos'
      });
    }

    // Validar propósito
    if (purpose !== 'register' && purpose !== 'reset-password') {
      return res.status(400).json({
        success: false,
        message: 'Propósito debe ser "register" o "reset-password"'
      });
    }

    // Obtener información del OTP
    const otpInfo = await otpService.getOTPInfo(
      email as string, 
      purpose as 'register' | 'reset-password'
    );

    res.json({
      success: true,
      message: 'Estado del OTP obtenido',
      data: {
        email,
        purpose,
        hasActiveOTP: otpInfo.hasActive,
        timeRemainingSeconds: otpInfo.timeRemaining,
        attemptsRemaining: otpInfo.attemptsRemaining
      }
    });
  } catch (error) {
    next(error);
  }
};

export const testEmailConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isConnected = await emailService.testConnection();
    
    res.json({
      success: true,
      message: isConnected ? 'Conexión de email exitosa' : 'Error en conexión de email',
      data: {
        connected: isConnected,
        emailHost: process.env.EMAIL_HOST,
        emailUser: process.env.EMAIL_USER
      }
    });
  } catch (error) {
    next(error);
  }
};
