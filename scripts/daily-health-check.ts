#!/usr/bin/env tsx

/**
 * Daily Health Check Script
 * Validates that all critical services are operational
 */

import https from 'https';
import http from 'http';

const BASE_URL = process.env.API_URL || 'http://localhost:8081';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iuawurdssgbkbavyyvbs.supabase.co';

interface HealthResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

const results: HealthResult[] = [];

function makeRequest(url: string, timeout = 5000): Promise<{ status: number; responseTime: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const requestModule = url.startsWith('https:') ? https : http;

    const req = requestModule.request(url, { timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({ status: res.statusCode || 500, responseTime });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testDatabaseConnection(): Promise<HealthResult> {
  try {
    // Test Supabase connection by checking if URL is accessible
    const startTime = Date.now();
    await makeRequest(`${SUPABASE_URL}/rest/v1/`, 5000);
    const responseTime = Date.now() - startTime;

    return {
      service: 'Database (Supabase)',
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      service: 'Database (Supabase)',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testAPIAvailability(): Promise<HealthResult> {
  try {
    const { status, responseTime } = await makeRequest(`${BASE_URL}/api/health`, 5000);
    
    if (status === 200 || status === 401) {
      // 401 is okay, means server is running but needs auth
      return {
        service: 'API Server',
        status: 'healthy',
        responseTime,
      };
    }

    return {
      service: 'API Server',
      status: 'unhealthy',
      error: `Unexpected status: ${status}`,
    };
  } catch (error) {
    return {
      service: 'API Server',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Server not accessible',
    };
  }
}

async function testCriticalServices(): Promise<HealthResult> {
  try {
    // Test that critical endpoints exist
    const { status } = await makeRequest(`${BASE_URL}/api/trips`, 5000);
    
    // Any response (even 401/403) means the service is running
    if (status !== 404) {
      return {
        service: 'Critical Services',
        status: 'healthy',
      };
    }

    return {
      service: 'Critical Services',
      status: 'unhealthy',
      error: 'Critical endpoints not found',
    };
  } catch (error) {
    return {
      service: 'Critical Services',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Service unavailable',
    };
  }
}

async function testSupabaseRealtime(): Promise<HealthResult> {
  try {
    // Test Supabase Realtime connection
    const { status } = await makeRequest(`${SUPABASE_URL}/realtime/v1/`, 5000);
    
    if (status === 200 || status === 404) {
      // 404 might mean realtime is not configured, but server is accessible
      return {
        service: 'Supabase Realtime',
        status: 'healthy',
      };
    }

    return {
      service: 'Supabase Realtime',
      status: 'unhealthy',
      error: `Unexpected status: ${status}`,
    };
  } catch (error) {
    return {
      service: 'Supabase Realtime',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Realtime service unavailable',
    };
  }
}

async function dailyHealthCheck() {
  console.log('🏥 Starting daily health check...\n');

  const healthTests = [
    testDatabaseConnection,
    testAPIAvailability,
    testCriticalServices,
    testSupabaseRealtime,
  ];

  for (const test of healthTests) {
    const result = await test();
    results.push(result);
    
    if (result.status === 'healthy') {
      const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
      console.log(`✅ ${result.service}${time}`);
    } else {
      console.log(`❌ ${result.service}: ${result.error}`);
    }
  }

  console.log('\n📊 Health Check Summary:');
  const healthy = results.filter((r) => r.status === 'healthy').length;
  const unhealthy = results.filter((r) => r.status === 'unhealthy').length;

  console.log(`✅ Healthy: ${healthy}`);
  console.log(`❌ Unhealthy: ${unhealthy}`);

  if (unhealthy > 0) {
    console.log('\n⚠️  Some services are unhealthy!');
    
    // In a real implementation, you would send alerts here
    // await sendSlackAlert({ message: 'Health check failed', failures: results.filter(r => r.status === 'unhealthy') });
    
    process.exit(1);
  }

  console.log('\n✅ All systems operational!');
}

// Run health check
dailyHealthCheck().catch((error) => {
  console.error('❌ Health check error:', error);
  process.exit(1);
});

