import { Request, Response, NextFunction } from 'express';
import reportService from '../services/report.service';

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await reportService.getAllReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.createReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};
