import type { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "../lib/auth";

export function requireApplicant(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== "applicant") {
      res.status(403).json({ error: "Applicant access required" });
      return;
    }
    (req as any).applicant = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
