import type { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "../lib/auth";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
