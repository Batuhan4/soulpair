import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[API Error]', err.message, err.stack?.split('\n')[1]);

  if (err.message.includes('SQLITE_CONSTRAINT')) {
    res.status(409).json({
      success: false,
      error: 'Conflict — resource already exists or constraint violated',
    });
    return;
  }

  if (err.message.includes('SQLITE_BUSY')) {
    res.status(503).json({
      success: false,
      error: 'Database busy — please retry',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
