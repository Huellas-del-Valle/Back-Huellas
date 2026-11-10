import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;
      
      const isSuccess = statusCode >= 200 && statusCode < 400;
      const statusType = isSuccess ? 'EXITOSO' : 'FALLIDO';

      const auditLog = {
        timestamp: new Date().toISOString(),
        status: statusType,
        statusCode,
        method,
        url: originalUrl,
        ip,
        userAgent,
        durationMs: duration,
        user: req.user
      };

      console.log(`[AUDIT] [${statusType}]`, auditLog);
    });

    next();
  }
}