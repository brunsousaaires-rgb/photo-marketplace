import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? 'Dados inválidos.';
    return res.status(400).json({ error: message });
  }

  const status = err instanceof ApiError ? err.status : err?.status ?? 500;
  const message = err?.message ?? 'Erro interno do servidor.';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
}
