/**
 * Centralized Logging Utility
 * 
 * Provides consistent logging across the application with environment-aware output.
 * In production, only errors are logged. In development, all levels are available.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: string, data?: any): void {
    if (this.isDevelopment && !this.isTest) {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, context?: string, data?: any): void {
    if (this.isDevelopment && !this.isTest) {
      this.log('info', message, context, data);
    }
  }

  /**
   * Log warnings (development and production)
   */
  warn(message: string, context?: string, data?: any): void {
    if (!this.isTest) {
      this.log('warn', message, context, data);
    }
  }

  /**
   * Log errors (all environments except test)
   */
  error(message: string, context?: string, data?: any): void {
    if (!this.isTest) {
      this.log('error', message, context, data);
    }
  }

  /**
   * Log performance metrics (development only)
   */
  performance(message: string, metrics: Record<string, number>, context?: string): void {
    if (this.isDevelopment && !this.isTest) {
      this.log('info', message, context || 'PERFORMANCE', metrics);
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      data
    };

    const prefix = context ? `[${context}]` : '';
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        if (data !== undefined) {
          console.debug(logMessage, data);
        } else {
          console.debug(logMessage);
        }
        break;
      case 'info':
        if (data !== undefined) {
          console.log(logMessage, data);
        } else {
          console.log(logMessage);
        }
        break;
      case 'warn':
        if (data !== undefined) {
          console.warn(logMessage, data);
        } else {
          console.warn(logMessage);
        }
        break;
      case 'error':
        if (data !== undefined) {
          console.error(logMessage, data);
        } else {
          console.error(logMessage);
        }
        break;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience methods for common contexts
export const performanceLogger = {
  log: (message: string, metrics: Record<string, number>) => 
    logger.performance(message, metrics, 'PERFORMANCE'),
  warn: (message: string, data?: any) => 
    logger.warn(message, 'PERFORMANCE', data),
  error: (message: string, data?: any) => 
    logger.error(message, 'PERFORMANCE', data)
};

export const clipboardLogger = {
  warn: (message: string, data?: any) => 
    logger.warn(message, 'CLIPBOARD', data),
  error: (message: string, data?: any) => 
    logger.error(message, 'CLIPBOARD', data)
};

export const storageLogger = {
  warn: (message: string, data?: any) => 
    logger.warn(message, 'STORAGE', data),
  error: (message: string, data?: any) => 
    logger.error(message, 'STORAGE', data)
};

export const errorBoundaryLogger = {
  error: (message: string, data?: any) => 
    logger.error(message, 'ERROR_BOUNDARY', data),
  warn: (message: string, data?: any) => 
    logger.warn(message, 'ERROR_BOUNDARY', data)
};