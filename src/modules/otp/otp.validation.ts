import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

// Validación para enviar OTP (registro o recuperación)
export const sendOTPSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
        invalid_type_error: 'El email debe ser una cadena de texto'
      })
      .email('Formato de email inválido')
      .min(5, 'El email debe tener al menos 5 caracteres')
      .max(40, 'El email no puede exceder 40 caracteres')
      .toLowerCase()
      .trim()
  })
});

// Validación para verificar OTP
export const verifyOTPSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
        invalid_type_error: 'El email debe ser una cadena de texto'
      })
      .email('Formato de email inválido')
      .min(5, 'El email debe tener al menos 5 caracteres')
      .max(40, 'El email no puede exceder 40 caracteres')
      .toLowerCase()
      .trim(),
    code: z
      .string({
        required_error: 'El código OTP es requerido',
        invalid_type_error: 'El código debe ser una cadena de texto'
      })
      .length(6, 'El código OTP debe tener exactamente 6 dígitos')
      .regex(/^\d{6}$/, 'El código OTP debe contener solo números'),
    purpose: z
      .enum(['register', 'reset-password'], {
        required_error: 'El propósito es requerido',
        invalid_type_error: 'El propósito debe ser "register" o "reset-password"'
      })
      .describe('Propósito del OTP: "register" para registro o "reset-password" para recuperación de contraseña')
  })
});

// Validación para resetear contraseña
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
        invalid_type_error: 'El email debe ser una cadena de texto'
      })
      .email('Formato de email inválido')
      .min(5, 'El email debe tener al menos 5 caracteres')
      .max(40, 'El email no puede exceder 40 caracteres')
      .toLowerCase()
      .trim(),
    code: z
      .string({
        required_error: 'El código OTP es requerido',
        invalid_type_error: 'El código debe ser una cadena de texto'
      })
      .length(6, 'El código OTP debe tener exactamente 6 dígitos')
      .regex(/^\d{6}$/, 'El código OTP debe contener solo números'),
    newPassword: z
      .string({
        required_error: 'La nueva contraseña es requerida',
        invalid_type_error: 'La contraseña debe ser una cadena de texto'
      })
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(25, 'La contraseña no puede exceder 25 caracteres')
      .trim()
  })
});

// Middleware de validación para usar en las rutas
export const validateSendOTP = validate(sendOTPSchema);
export const validateVerifyOTP = validate(verifyOTPSchema);
export const validateResetPassword = validate(resetPasswordSchema);

// Tipos TypeScript derivados de los esquemas
export type SendOTPData = z.infer<typeof sendOTPSchema>['body'];
export type VerifyOTPData = z.infer<typeof verifyOTPSchema>['body'];
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>['body'];
