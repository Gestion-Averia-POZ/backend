import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';

const app = express();

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos públicos — sin autenticación (heatmap-data.json)
app.use(express.static(path.join(process.cwd(), 'public')));

// Swagger Documentation
setupSwagger(app);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;
