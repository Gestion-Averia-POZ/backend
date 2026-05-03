import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

/**
 * Mapa interno: userId -> socketId
 * Permite saber qué socket pertenece a qué usuario autenticado.
 */
const userSocketMap = new Map<string, string>();

let ioInstance: Server | null = null;

/**
 * Registra la instancia de Socket.io.
 * Debe llamarse desde server.ts justo después de inicializar io.
 */
export function setIo(io: Server): void {
  ioInstance = io;
}

/**
 * Registra la conexión de un usuario.
 * Si el usuario ya tenía un socket anterior (reconexión), lo sobreescribe.
 */
export function register(userId: string, socketId: string): void {
  userSocketMap.set(userId, socketId);
  console.log(`🔌 Socket registrado — userId: ${userId} | socketId: ${socketId}`);
}

/**
 * Elimina la entrada del mapa cuando un socket se desconecta.
 * Busca por socketId para obtener el userId correspondiente.
 */
export function unregister(socketId: string): void {
  for (const [userId, sid] of userSocketMap.entries()) {
    if (sid === socketId) {
      userSocketMap.delete(userId);
      console.log(`🔌 Socket desregistrado — userId: ${userId} | socketId: ${socketId}`);
      return;
    }
  }
}

/**
 * Emite el evento 'new_notification' al socket del usuario si está conectado.
 * Si el usuario no está conectado, la notificación ya fue persistida en BD
 * y la verá al hacer fetch en su próxima sesión.
 */
export function notifyUser(userId: string, payload: object): void {
  if (!ioInstance) {
    console.warn('⚠️  socketService.notifyUser() llamado antes de setIo()');
    return;
  }

  const socketId = userSocketMap.get(userId);
  if (socketId) {
    ioInstance.to(socketId).emit('new_notification', payload);
    console.log(`📬 Notificación enviada — userId: ${userId} | socketId: ${socketId}`);
  } else {
    console.log(`📭 Usuario no conectado, notificación solo en BD — userId: ${userId}`);
  }
}

/**
 * Valida el JWT recibido en el handshake del socket.
 * Retorna el userId si el token es válido, null si no lo es.
 */
export function validateSocketToken(token: string): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}
