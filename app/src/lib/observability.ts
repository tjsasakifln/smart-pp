import logger from './logger';

export class PerformanceMonitor {
  private startTime: number;
  private startMemory: NodeJS.MemoryUsage;

  constructor(private operationName: string) {
    this.startTime = performance.now();
    this.startMemory = process.memoryUsage();
  }

  end(): void {
    const duration = performance.now() - this.startTime;
    const memoryDiff = process.memoryUsage();

    logger.info(
      {
        operation: this.operationName,
        duration: Math.round(duration),
        heapUsedMb: Math.round(memoryDiff.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryDiff.heapTotal / 1024 / 1024),
      },
      'Performance: ' + this.operationName + ' completed'
    );
  }
}

export function logError(
  error: Error | unknown,
  context: Record<string, any> = {}
): void {
  if (error instanceof Error) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        ...context,
      },
      'Error: ' + error.message
    );
  } else {
    logger.error(
      {
        error: String(error),
        ...context,
      },
      'Error: ' + String(error)
    );
  }
}

export function logRequest(
  method: string,
  path: string,
  metadata: Record<string, any> = {}
): void {
  logger.info(
    {
      method,
      path,
      ...metadata,
    },
    method + ' ' + path
  );
}

export function getApplicationVersion(): string {
  return process.env.APP_VERSION || '1.0.0';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
