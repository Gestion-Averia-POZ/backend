import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Reportes API',
      version: '1.0.0',
      description: 'API REST para sistema de reportes de averías con Node.js, Express, TypeScript, PostgreSQL y PostGIS',
      contact: {
        name: 'API Support',
        email: 'support@reportes.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.reportes.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Juan Carlos' },
            lastname: { type: 'string', example: 'Pérez García' },
            email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
            phoneNumber: { type: 'string', example: '+584121234567' },
            role: { type: 'string', example: 'CITIZEN' },
            isActive: { type: 'boolean', example: true },
            verifiedEmail: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'lastname', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50, example: 'Juan Carlos' },
            lastname: { type: 'string', minLength: 2, maxLength: 50, example: 'Pérez García' },
            email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
            password: { type: 'string', minLength: 8, maxLength: 100, example: 'MiPassword123' },
            phoneNumber: { type: 'string', example: '+584121234567' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
            password: { type: 'string', example: 'MiPassword123' }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50, example: 'Juan Carlos' },
            lastname: { type: 'string', minLength: 2, maxLength: 50, example: 'Pérez García' },
            email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
            password: { type: 'string', minLength: 8, maxLength: 100, example: 'NuevaPassword123' },
            phoneNumber: { type: 'string', example: '+584121234567' },
            isActive: { type: 'boolean', example: true },
            verifiedEmail: { type: 'boolean', example: true }
          }
        },
        SendOTPRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@example.com' }
          }
        },
        VerifyOTPRequest: {
          type: 'object',
          required: ['email', 'code', 'purpose'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@example.com' },
            code: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' },
            purpose: { type: 'string', enum: ['register', 'reset-password'], example: 'register' }
          }
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['email', 'code', 'newPassword'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@example.com' },
            code: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' },
            newPassword: { type: 'string', minLength: 8, maxLength: 100, example: 'NuevaPassword123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login exitoso' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'OK' },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number', example: 123.456 },
                environment: { type: 'string', example: 'development' },
                version: { type: 'string', example: '1.0.0' },
                services: {
                  type: 'object',
                  properties: {
                    database: { type: 'string', example: 'connected' },
                    server: { type: 'string', example: 'running' }
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'OTP',
        description: 'One-Time Password operations for registration and password reset'
      },
      {
        name: 'Reports',
        description: 'Report management with automatic neighborhood detection using PostGIS'
      },
      {
        name: 'Categories',
        description: 'Category management operations'
      },
      {
        name: 'Companies',
        description: 'Company management operations'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/modules/*/*.routes.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Sistema de Reportes API Documentation'
  }));
};

export default specs;