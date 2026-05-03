import { Request, Response, NextFunction } from 'express';
import { requestsService } from './requests.service';

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; // Requerido por el middleware auth
    const request = await requestsService.createRequest(req.body, userId);
    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: { request }
    });
  } catch (error: any) {
    next(error);
  }
};

export const createPublicRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Forzamos el tipo a REGISTRO y no enviamos userId
    const publicData = {
      ...req.body,
      type: 'REGISTRO'
    };
    const request = await requestsService.createRequest(publicData);
    res.status(201).json({
      success: true,
      message: 'Solicitud de registro creada exitosamente',
      data: { request }
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await requestsService.getAllRequests();
    res.status(200).json({
      success: true,
      data: { requests }
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await requestsService.getRequestById(id);
    res.status(200).json({
      success: true,
      data: { request }
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRequestsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const requests = await requestsService.getRequestsByUser(userId);
    res.status(200).json({
      success: true,
      data: { requests }
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateRequestState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { state } = req.body;
    const updatedRequest = await requestsService.updateRequestState(id, state);
    res.status(200).json({
      success: true,
      message: `Solicitud actualizada a estado ${state}`,
      data: { request: updatedRequest }
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await requestsService.deleteRequest(id);
    res.status(200).json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    });
  } catch (error: any) {
    next(error);
  }
};
