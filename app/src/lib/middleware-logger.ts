import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and duration
 */
export function withRequestLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const { method, url } = req;
    const pathname = new URL(url).pathname;

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;

      logger.info(
        {
          method,
          path: pathname,
          status: response.status,
          duration,
        },
        `${method} ${pathname} ${response.status} (${duration}ms)`
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          method,
          path: pathname,
          duration,
          error: error instanceof Error ? error.message : String(error),
        },
        `${method} ${pathname} ERROR (${duration}ms)`
      );

      throw error;
    }
  };
}

/**
 * Error boundary for API routes
 * Catches and logs errors with proper formatting
 */
export function withErrorBoundary(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          url: req.url,
        },
        'Unhandled error in API route'
      );

      return NextResponse.json(
        {
          error: 'Internal Server Error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}
