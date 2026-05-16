import type { Request, Response, NextFunction } from "express";

// Admin authentication middleware
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.adminId || !req.session.adminUser) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
};

// Unit manager authentication middleware
export const requireGestorAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.gestorUnidadeId) {
    return res.status(401).json({ message: "Unit manager authentication required" });
  }
  next();
};

// Guardian authentication middleware
export const requireResponsavelAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.responsavelId) {
    return res.status(401).json({ message: "Guardian authentication required" });
  }
  next();
};