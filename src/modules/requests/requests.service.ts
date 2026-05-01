import prisma from '../../config/prisma';
import { notificationsService } from '../notifications/notifications.service';
import { RequestType } from '@prisma/client';

class RequestsService {
  async createRequest(data: any, userId?: string) {
    // Buscar o crear el estado PENDIENTE
    let state = await prisma.state.findFirst({
      where: { name: 'PENDIENTE' }
    });

    if (!state) {
      state = await prisma.state.create({
        data: { name: 'PENDIENTE', colorHex: '#FFA500' }
      });
    }

    const request = await prisma.request.create({
      data: {
        applicantName: data.applicantName,
        type: data.type as RequestType,
        description: data.description,
        stateId: state.id,
        userId: userId || null
      },
      include: {
        state: true,
        user: {
          select: { name: true, lastname: true, email: true }
        }
      }
    });

    // Notificar a todos los administradores
    await notificationsService.notifyAllAdmins(
      `Nueva Solicitud: ${data.type}`,
      `El solicitante ${data.applicantName} ha creado una nueva solicitud de tipo ${data.type}.`,
      'NEW_REQUEST'
    );

    return request;
  }

  async getAllRequests() {
    return await prisma.request.findMany({
      include: {
        state: true,
        user: {
          select: { name: true, lastname: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRequestById(id: string) {
    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        state: true,
        user: {
          select: { name: true, lastname: true, email: true }
        }
      }
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    return request;
  }

  async getRequestsByUser(userId: string) {
    return await prisma.request.findMany({
      where: { userId },
      include: {
        state: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateRequestState(id: string, stateName: string) {
    // Buscar el estado (PENDIENTE, APROBADO, CANCELADO)
    let state = await prisma.state.findFirst({
      where: { name: stateName }
    });

    if (!state) {
      // Si no existe, lo creamos (aunque idealmente deberían estar en el seed)
      const colorMap: { [key: string]: string } = {
        'PENDIENTE': '#FFA500',
        'APROBADO': '#00AA00',
        'CANCELADO': '#CC0000'
      };
      state = await prisma.state.create({
        data: { name: stateName, colorHex: colorMap[stateName] || '#999999' }
      });
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { stateId: state.id },
      include: { state: true }
    });

    // Si la solicitud tiene un usuario asociado, notificarle del cambio de estado
    if (updatedRequest.userId) {
      await prisma.notification.create({
        data: {
          userId: updatedRequest.userId,
          title: 'Actualización de Solicitud',
          description: `Tu solicitud de tipo ${updatedRequest.type} ha cambiado de estado a ${stateName}.`,
          type: 'REQUEST_STATE_CHANGE',
          isRead: false
        }
      });
    }

    return updatedRequest;
  }

  async deleteRequest(id: string) {
    const existingRequest = await prisma.request.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      throw new Error('Solicitud no encontrada');
    }

    return await prisma.request.delete({
      where: { id }
    });
  }
}

export const requestsService = new RequestsService();
