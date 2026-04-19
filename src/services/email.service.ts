import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OTPEmailData {
  email: string;
  code: string;
  purpose: 'register' | 'reset-password';
  expiresInMinutes?: number;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verificar conexión al inicializar
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Servidor de email conectado correctamente');
    } catch (error) {
      console.error('❌ Error conectando al servidor de email:', error);
    }
  }

  // Plantilla HTML base para OTP
  private getBaseOTPTemplate(data: OTPEmailData, title: string, message: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }

            .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
            }

            .header h1 {
                color: #2c3e50;
                margin: 0;
                font-size: 24px;
            }

            .header .subtitle {
                color: #7f8c8d;
                font-size: 14px;
                margin-top: 5px;
            }

            .otp-code {
                background-color: #f8f9fa;
                border: 2px dashed #3498db;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }

            .otp-code .code {
                font-size: 36px;
                font-weight: bold;
                color: #2c3e50;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }

            .message {
                text-align: center;
                margin: 20px 0;
                color: #555;
                line-height: 1.8;
            }

            .message p {
                margin: 15px 0;
            }

            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
                color: #856404;
            }

            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #7f8c8d;
            }

            .footer p {
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <div class="subtitle">Sistema de Reportes Urbis</div>
            </div>

            <div class="message">
                <p>¡Hola!</p>
                <p>${message}</p>
            </div>

            <div class="otp-code">
                <div class="code">${data.code}</div>
            </div>

            <div class="message">
                <p><strong>Este código expira en ${data.expiresInMinutes || 10} minutos</strong></p>
                <p>Si no solicitaste esta acción, puedes ignorar este email.</p>
            </div>

            <div class="warning">
                <strong>Importante:</strong> Nunca compartas este código con nadie. Nuestro equipo nunca te pedirá este código.
            </div>

            <div class="footer">
                <p>Este email fue enviado desde una dirección de solo envío.</p>
                <p>Por favor no respondas a este mensaje.</p>
                <p>&copy; 2024 Sistema Urbis. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Plantilla para OTP de registro
  private getRegisterOTPTemplate(data: OTPEmailData): string {
    return this.getBaseOTPTemplate(
      data,
      'Código de Verificación',
      'Gracias por registrarte en nuestro sistema.<br><br>Para completar tu registro, utiliza el siguiente código de verificación:'
    );
  }

  // Plantilla para OTP de recuperación de contraseña
  private getResetPasswordOTPTemplate(data: OTPEmailData): string {
    return this.getBaseOTPTemplate(
      data,
      'Recuperación de Contraseña',
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta.<br><br>Utiliza el siguiente código para continuar:'
    );
  }

  // Método principal para enviar emails
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Sistema Urbis',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || ''
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', info.messageId);
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error('Error al enviar el email');
    }
  }

  // Enviar OTP para registro
  async sendRegisterOTP(data: OTPEmailData): Promise<void> {
    const subject = 'Código de Verificación - Registro en Urbis';
    const html = this.getRegisterOTPTemplate(data);
    const text = `Tu código de verificación para registro en Urbis es: ${data.code}. Este código expira en ${data.expiresInMinutes || 10} minutos.`;

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text
    });
  }

  // Enviar OTP para recuperación de contraseña
  async sendResetPasswordOTP(data: OTPEmailData): Promise<void> {
    const subject = 'Código de Recuperación - Urbis';
    const html = this.getResetPasswordOTPTemplate(data);
    const text = `Tu código de recuperación de contraseña para Urbis es: ${data.code}. Este código expira en ${data.expiresInMinutes || 10} minutos.`;

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text
    });
  }

  // Método genérico para enviar OTP
  async sendOTP(email: string, code: string, purpose: 'register' | 'reset-password'): Promise<void> {
    const data: OTPEmailData = {
      email,
      code,
      purpose,
      expiresInMinutes: 10
    };

    if (purpose === 'register') {
      await this.sendRegisterOTP(data);
    } else {
      await this.sendResetPasswordOTP(data);
    }
  }

  // Método para probar la conexión
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Error en conexión de email:', error);
      return false;
    }
  }
}

export default new EmailService();
