import crypto from 'crypto';
import redisClient from '../../config/redisClient';
import emailService from '../../services/email.service';

interface OTPData {
  code: string;
  attempts: number;
  createdAt: number;
  purpose: 'register' | 'reset-password';
}

interface OTPInfo {
  hasActive: boolean;
  timeRemaining?: number;
  attemptsRemaining?: number;
}

class OTPService {
  private readonly OTP_EXPIRY = 10 * 60; // 10 minutos en segundos
  private readonly MAX_ATTEMPTS = 3;

  // Generar código OTP de 6 dígitos de forma más eficiente
  private generateOTP(): string {
    // Usar crypto.randomInt es más eficiente que Math.random
    return crypto.randomInt(100000, 999999).toString();
  }

  // Generar key de Redis con prefijo consistente
  private getRedisKey(email: string, purpose: string): string {
    return `otp:${purpose}:${email.toLowerCase()}`;
  }

  // Parsear datos de Redis de forma segura
  private parseOTPData(data: unknown): OTPData | null {
    if (!data) return null;
    
    // Si ya es un objeto (Upstash Redis devuelve objetos parseados)
    if (typeof data === 'object' && data !== null) {
      return data as OTPData;
    }
    
    // Si es string, parsear
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as OTPData;
      } catch (error) {
        console.error('Error parsing OTP data:', error);
        return null;
      }
    }
    
    return null;
  }

  // Calcular tiempo restante de forma eficiente
  private calculateTimeRemaining(createdAt: number): number {
    const elapsed = Math.floor((Date.now() - createdAt) / 1000);
    return Math.max(0, this.OTP_EXPIRY - elapsed);
  }

  // Enviar OTP con validaciones optimizadas
  async sendOTP(email: string, purpose: 'register' | 'reset-password'): Promise<void> {
    const key = this.getRedisKey(email, purpose);
    
    // Verificar si ya existe un OTP activo
    const existingData = await redisClient.get(key);
    console.log(`🔍 Verificando OTP existente para ${email}:`, existingData);
    
    if (existingData) {
      const otpData = this.parseOTPData(existingData);
      console.log(`📋 OTP parseado:`, otpData);
      
      if (otpData) {
        const timeRemaining = this.calculateTimeRemaining(otpData.createdAt);
        console.log(`⏱️ Tiempo restante: ${timeRemaining} segundos`);
        
        if (timeRemaining > 0) {
          const minutesRemaining = Math.ceil(timeRemaining / 60);
          throw new Error(`Ya tienes un código activo. Espera ${minutesRemaining} minuto(s) o usa el código actual`);
        }
      }
    }

    // Generar y guardar nuevo OTP
    const code = this.generateOTP();
    const otpData: OTPData = {
      code,
      attempts: 0,
      createdAt: Date.now(),
      purpose
    };
    // Guardar en Redis con expiración (Upstash Redis usa setex)
    await redisClient.setex(key, this.OTP_EXPIRY, JSON.stringify(otpData));
    
    // Verificar que se guardó correctamente
    const saved = await redisClient.get(key);
    console.log(`✅ OTP guardado verificado:`, saved);

    // Enviar email con el código OTP
    try {
      await emailService.sendOTP(email, code, purpose);
      console.log(`📧 OTP enviado por email a ${email} (${purpose}): ${code}`);
    } catch (error) {
      console.error('Error enviando email OTP:', error);
      // En caso de error de email, eliminar el OTP de Redis
      await redisClient.del(key);
      throw new Error('Error al enviar el código por email. Inténtalo de nuevo.');
    }
  }

  // Verificar OTP con operaciones optimizadas
  async verifyOTP(email: string, code: string, purpose: 'register' | 'reset-password'): Promise<boolean> {
    const key = this.getRedisKey(email, purpose);
    
    // Obtener datos de Redis
    const data = await redisClient.get(key);
    const otpData = this.parseOTPData(data);

    if (!otpData) {
      throw new Error('Código OTP no encontrado o expirado');
    }

    // Verificar si excedió los intentos máximos
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      // Eliminar OTP de forma asíncrona (no bloquear)
      redisClient.del(key).catch(err => console.error('Error deleting expired OTP:', err));
      throw new Error('Máximo número de intentos excedido. Solicita un nuevo código');
    }

    // Verificar el código
    if (otpData.code !== code) {
      // Incrementar intentos de forma atómica
      otpData.attempts += 1;
      const timeRemaining = this.calculateTimeRemaining(otpData.createdAt);
      
      if (timeRemaining > 0) {
        await redisClient.setex(key, timeRemaining, JSON.stringify(otpData));
      } else {
        // OTP expirado, eliminar
        redisClient.del(key).catch(err => console.error('Error deleting expired OTP:', err));
        throw new Error('Código OTP expirado');
      }
      
      const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;
      throw new Error(`Código incorrecto. Te quedan ${remainingAttempts} intentos`);
    }

    // Código correcto - eliminar de Redis (un solo uso)
    await redisClient.del(key);
    return true;
  }

  // Limpiar OTP de forma eficiente
  async clearOTP(email: string, purpose: 'register' | 'reset-password'): Promise<void> {
    const key = this.getRedisKey(email, purpose);
    await redisClient.del(key);
  }

  // Verificar si existe un OTP activo (operación rápida)
  async hasActiveOTP(email: string, purpose: 'register' | 'reset-password'): Promise<boolean> {
    const key = this.getRedisKey(email, purpose);
    const exists = await redisClient.exists(key);
    return exists === 1;
  }

  // Obtener información del OTP de forma optimizada
  async getOTPInfo(email: string, purpose: 'register' | 'reset-password'): Promise<OTPInfo> {
    const key = this.getRedisKey(email, purpose);
    const data = await redisClient.get(key);
    const otpData = this.parseOTPData(data);
    
    if (!otpData) {
      return { hasActive: false };
    }

    const timeRemaining = this.calculateTimeRemaining(otpData.createdAt);
    const attemptsRemaining = Math.max(0, this.MAX_ATTEMPTS - otpData.attempts);

    // Si el tiempo expiró, limpiar de forma asíncrona
    if (timeRemaining <= 0) {
      redisClient.del(key).catch(err => console.error('Error deleting expired OTP:', err));
      return { hasActive: false };
    }

    return {
      hasActive: true,
      timeRemaining,
      attemptsRemaining
    };
  }

  // Método para limpiar OTPs expirados
  async cleanupExpiredOTPs(): Promise<number> {
    try {
      const pattern = 'otp:*';
      const keys = await redisClient.keys(pattern);
      
      if (keys.length === 0) return 0;

      const expiredKeys: string[] = [];
      
      // Procesar en lotes para evitar bloquear Redis
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const pipeline = redisClient.multi();
        
        batch.forEach(key => pipeline.get(key));
        const results = await pipeline.exec();

        if (results) {
          results.forEach((result, index) => {
            if (result && Array.isArray(result) && result[1]) {
              const otpData = this.parseOTPData(result[1]);
              if (otpData) {
                const timeRemaining = this.calculateTimeRemaining(otpData.createdAt);
                if (timeRemaining <= 0) {
                  expiredKeys.push(batch[index]);
                }
              }
            }
          });
        }
      }

      if (expiredKeys.length > 0) {
        await redisClient.del(...expiredKeys);
      }

      return expiredKeys.length;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }
}

export default new OTPService();