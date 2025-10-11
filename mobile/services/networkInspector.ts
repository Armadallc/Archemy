import { logger } from './logger';

interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  headers?: any;
  body?: any;
  timestamp: string;
  status?: number;
  responseTime?: number;
  responseBody?: any;
  error?: string;
}

class NetworkInspector {
  private requests: NetworkRequest[] = [];
  private maxRequests = 100; // Keep last 100 requests
  private isEnabled = __DEV__; // Only enable in development

  constructor() {
    if (this.isEnabled) {
      this.setupNetworkInterception();
    }
  }

  private setupNetworkInterception() {
    // Intercept fetch requests
    const originalFetch = global.fetch;
    
    global.fetch = async (...args: any[]) => {
      const [url, options = {}] = args;
      const method = options.method || 'GET';
      const requestId = this.generateRequestId();
      
      const request: NetworkRequest = {
        id: requestId,
        method,
        url: url.toString(),
        headers: options.headers,
        body: options.body,
        timestamp: new Date().toISOString(),
      };

      this.addRequest(request);
      
      // Log the request
      logger.logApiRequest(method, url.toString(), options.headers, options.body);

      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const responseTime = Date.now() - startTime;
        
        // Clone response to read body without consuming it
        const responseClone = response.clone();
        let responseBody;
        
        try {
          responseBody = await responseClone.json();
        } catch {
          responseBody = await responseClone.text();
        }

        // Update request with response data
        this.updateRequest(requestId, {
          status: response.status,
          responseTime,
          responseBody,
        });

        // Log the response
        logger.logApiResponse(method, url.toString(), response.status, responseTime, responseBody);

        return response;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Update request with error data
        this.updateRequest(requestId, {
          status: 0,
          responseTime,
          error: error instanceof Error ? error.message : String(error),
        });

        // Log the error
        logger.error(`API Error: ${method} ${url}`, 'NetworkInspector', {
          error: error instanceof Error ? error.message : String(error),
          responseTime,
        });

        throw error;
      }
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addRequest(request: NetworkRequest) {
    this.requests.push(request);
    if (this.requests.length > this.maxRequests) {
      this.requests.shift(); // Remove oldest request
    }
  }

  private updateRequest(requestId: string, updates: Partial<NetworkRequest>) {
    const requestIndex = this.requests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      this.requests[requestIndex] = { ...this.requests[requestIndex], ...updates };
    }
  }

  // Get all requests
  getAllRequests(): NetworkRequest[] {
    return [...this.requests];
  }

  // Get requests by status
  getRequestsByStatus(status: number): NetworkRequest[] {
    return this.requests.filter(req => req.status === status);
  }

  // Get failed requests
  getFailedRequests(): NetworkRequest[] {
    return this.requests.filter(req => req.status && req.status >= 400);
  }

  // Get slow requests (over threshold)
  getSlowRequests(thresholdMs: number = 1000): NetworkRequest[] {
    return this.requests.filter(req => req.responseTime && req.responseTime > thresholdMs);
  }

  // Get recent requests
  getRecentRequests(count: number = 20): NetworkRequest[] {
    return this.requests.slice(-count);
  }

  // Clear all requests
  clearRequests() {
    this.requests = [];
  }

  // Export requests as JSON
  exportRequests(): string {
    return JSON.stringify(this.requests, null, 2);
  }

  // Get network statistics
  getNetworkStats() {
    const totalRequests = this.requests.length;
    const successfulRequests = this.requests.filter(req => req.status && req.status < 400).length;
    const failedRequests = this.requests.filter(req => req.status && req.status >= 400).length;
    const avgResponseTime = this.requests
      .filter(req => req.responseTime)
      .reduce((sum, req) => sum + (req.responseTime || 0), 0) / totalRequests || 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
    };
  }

  // Enable/disable network inspection
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.setupNetworkInterception();
    }
  }
}

export const networkInspector = new NetworkInspector();
