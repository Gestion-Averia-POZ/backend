import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check the health status of the API and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/HealthResponse'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       example: false
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           example: ERROR
 *                         error:
 *                           type: string
 *                           example: Database connection failed
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'connected',
        server: 'running'
      }
    };

    res.status(200).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    const healthStatus = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'disconnected',
        server: 'running'
      },
      error: 'Database connection failed'
    };

    res.status(503).json({
      success: false,
      data: healthStatus
    });
  }
});

export default router;