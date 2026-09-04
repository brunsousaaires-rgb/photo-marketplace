import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Envolve handlers assíncronos para encaminhar rejeições ao errorHandler (Express 4 não faz isso sozinho). */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
