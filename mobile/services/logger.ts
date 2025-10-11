export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  metadata?: any;
  stack?: string;
}

class Logger {
  private isDevelopment = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(level: LogLevel, message: string, component?: string, metadata?: any) {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component,
      metadata,
    };

    // Add to memory buffer
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output with emojis for better visibility
    const emoji = this.getEmojiForLevel(level);
    const prefix = `[${level}] ${emoji}`;
    
    if (component) {
      console.log(`${prefix} [${component}] ${message}`, metadata || '');
    } else {
      console.log(`${prefix} ${message}`, metadata || '');
    }

    // In production, send to remote logging service
    if (!this.isDevelopment) {
      this.sendToRemoteLogging(logEntry);
    }
  }

  debug(message: string, component?: string, metadata?: any) {
    this.log(LogLevel.DEBUG, message, component, metadata);
  }

  info(message: string, component?: string, metadata?: any) {
    this.log(LogLevel.INFO, message, component, metadata);
  }

  warn(message: string, component?: string, metadata?: any) {
    this.log(LogLevel.WARN, message, component, metadata);
  }

  error(message: string, component?: string, metadata?: any, error?: Error) {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      component,
      metadata,
      stack: error?.stack,
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.error(`[ERROR] 🚨 [${component || 'Unknown'}] ${message}`, metadata || '', error || '');
    
    if (!this.isDevelopment) {
      this.sendToRemoteLogging(logEntry);
    }
  }

  // API Request/Response logging
  logApiRequest(method: string, url: string, headers?: any, body?: any) {
    this.debug(`API Request: ${method} ${url}`, 'API', {
      headers: this.sanitizeHeaders(headers),
      body: this.sanitizeBody(body),
    });
  }

  logApiResponse(method: string, url: string, status: number, responseTime: number, body?: any) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${url} - ${status} (${responseTime}ms)`, 'API', {
      status,
      responseTime,
      body: this.sanitizeBody(body),
    });
  }

  // User Action logging
  logUserAction(action: string, component: string, metadata?: any) {
    this.info(`User Action: ${action}`, component, metadata);
  }

  // Navigation logging
  logNavigation(from: string, to: string, metadata?: any) {
    this.debug(`Navigation: ${from} → ${to}`, 'Navigation', metadata);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: any) {
    this.info(`Performance: ${operation} took ${duration}ms`, 'Performance', metadata);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private getEmojiForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '🚨';
      default: return '📝';
    }
  }

  private sanitizeHeaders(headers?: any): any {
    if (!headers) return headers;
    
    const sanitized = { ...headers };
    // Remove sensitive headers
    delete sanitized['Authorization'];
    delete sanitized['Cookie'];
    delete sanitized['X-API-Key'];
    return sanitized;
  }

  private sanitizeBody(body?: any): any {
    if (!body) return body;
    
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return this.sanitizeBody(parsed);
      } catch {
        return '[String Body]';
      }
    }
    
    if (typeof body === 'object') {
      const sanitized = { ...body };
      // Remove sensitive fields
      delete sanitized['password'];
      delete sanitized['token'];
      delete sanitized['secret'];
      return sanitized;
    }
    
    return body;
  }

  private async sendToRemoteLogging(logEntry: LogEntry) {
    try {
      // In production, implement remote logging here
      // Example: Send to your backend API or third-party service
      console.log('📤 Would send to remote logging:', logEntry);
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }
}

export const logger = new Logger();
