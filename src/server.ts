import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import cron from 'node-cron';
import app from './app';
import * as socketService from './services/socket.service';
import { heatmapService } from './services/heatmap.service';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Crear servidor HTTP explícito para poder adjuntar Socket.io
const httpServer = http.createServer(app);

// Inicializar Socket.io sobre el servidor HTTP
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Registrar la instancia de io en el socketService (evita dependencias circulares)
socketService.setIo(io);

// Manejar conexiones de Socket.io
io.on('connection', (socket: Socket) => {
  // El token JWT se pasa como query param en la conexión
  const token = socket.handshake.query.token as string | undefined;

  if (!token) {
    console.warn(`⚠️  Conexión rechazada (sin token) — socketId: ${socket.id}`);
    socket.disconnect(true);
    return;
  }

  const userId = socketService.validateSocketToken(token);

  if (!userId) {
    console.warn(`⚠️  Conexión rechazada (token inválido) — socketId: ${socket.id}`);
    socket.disconnect(true);
    return;
  }

  // Registrar la conexión autenticada
  socketService.register(userId, socket.id);

  socket.on('disconnect', () => {
    socketService.unregister(socket.id);
  });
});

// Arrancar el servidor HTTP (no app.listen, sino httpServer.listen)
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`❤️  Health: http://${HOST}:${PORT}/api/health`);
  console.log(`📚 Swagger: http://${HOST}:${PORT}/api/docs`);
  console.log(`🔌 WebSocket ready`);

  // Generar heatmap al arrancar y programar actualización diaria a las 02:00
  heatmapService.generate().catch((err) =>
    console.error('Error al generar heatmap inicial:', err)
  );
  cron.schedule('0 2 * * *', () => {
    heatmapService.generate().catch((err) =>
      console.error('Error en cron heatmap:', err)
    );
  });
  console.log('⏰ Heatmap cron programado (diario 02:00)');
});
