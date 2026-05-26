import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos públicos — sin autenticación (heatmap-data.json)
app.use(express.static(path.join(process.cwd(), 'public')));

// Imágenes de reportes — servidas públicamente
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger Documentation
setupSwagger(app);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;
