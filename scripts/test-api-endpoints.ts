#!/usr/bin/env ts-node

/**
 * Test API Endpoints directly
 * This tests if the API routes are accessible and working
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  message: string;
}

class APITester {
  private results: TestResult[] = [];

  private log(message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      RESET: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${type}: ${message}${colors.RESET}`);
  }

  private async testEndpoint(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<void> {
    try {
      this.log(`Testing ${method} ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const statusCode = response.status;
      const text = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }

      if (statusCode < 400) {
        this.results.push({
          endpoint,
          method,
          status: 'PASS',
          statusCode,
          message: `Success: ${statusCode}`
        });
        this.log(`✓ PASS: ${method} ${endpoint} (${statusCode})`, 'SUCCESS');
        if (Array.isArray(responseData)) {
          this.log(`  Response: Array with ${responseData.length} items`);
        } else if (typeof responseData === 'object' && responseData !== null) {
          this.log(`  Response: Object with keys: ${Object.keys(responseData).join(', ')}`);
        }
      } else {
        this.results.push({
          endpoint,
          method,
          status: 'FAIL',
          statusCode,
          message: `Failed: ${statusCode} - ${responseData?.error || text}`
        });
        this.log(`✗ FAIL: ${method} ${endpoint} (${statusCode})`, 'ERROR');
        this.log(`  Error: ${responseData?.error || text}`, 'ERROR');
      }
    } catch (error: any) {
      this.results.push({
        endpoint,
        method,
        status: 'FAIL',
        message: `Network error: ${error.message}`
      });
      this.log(`✗ FAIL: ${method} ${endpoint} - ${error.message}`, 'ERROR');
    }
  }

  async testAllEndpoints() {
    this.log('Starting API Endpoint Tests', 'INFO');
    this.log('==============================', 'INFO');

    // Test data endpoints
    await this.testEndpoint('/api/data/countries', 'GET');
    await this.testEndpoint('/api/data/business-units', 'GET');
    
    // Test SOV endpoints
    await this.testEndpoint('/api/admin/share-of-voice/countries', 'GET');
    await this.testEndpoint('/api/admin/share-of-voice/business-units', 'GET');
    await this.testEndpoint('/api/admin/share-of-voice/categories?businessUnitId=1', 'GET');
    await this.testEndpoint('/api/admin/share-of-voice/data?countryId=1&businessUnitId=1', 'GET');

    // Test SOV save endpoint (the problematic one)
    const testSOVData = {
      countryId: 1,
      businessUnitId: 1,
      mediaType: 'tv',
      data: [
        {
          category: 'Test Category',
          company: 'Test Company',
          totalTvInvestment: 1000,
          totalTvTrps: 100
        }
      ]
    };
    
    await this.testEndpoint('/api/admin/share-of-voice/save', 'POST', testSOVData);

    this.printSummary();
  }

  private printSummary() {
    this.log('==============================', 'INFO');
    this.log('API Test Summary', 'INFO');
    this.log('==============================', 'INFO');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.log(`Total Endpoints: ${total}`, 'INFO');
    this.log(`Passed: ${passed}`, passed === total ? 'SUCCESS' : 'INFO');
    this.log(`Failed: ${failed}`, failed > 0 ? 'ERROR' : 'INFO');

    if (failed > 0) {
      this.log('Failed Endpoints:', 'ERROR');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          this.log(`  - ${r.method} ${r.endpoint}: ${r.message}`, 'ERROR');
        });
    }

    this.log('==============================', 'INFO');
    this.log(failed === 0 ? 'ALL API TESTS PASSED! ✅' : 'SOME API TESTS FAILED! ❌', failed === 0 ? 'SUCCESS' : 'ERROR');
  }
}

// Run the tests
async function main() {
  // Check if development server is running
  try {
    const response = await fetch(`${BASE_URL}/api/data/countries`);
    if (!response.ok) {
      throw new Error('Server not responding properly');
    }
  } catch (error) {
    console.error('❌ Development server is not running or not accessible at http://localhost:3000');
    console.error('Please run "npm run dev" first, then run this test again.');
    process.exit(1);
  }

  const tester = new APITester();
  await tester.testAllEndpoints();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('API test suite failed:', error);
    process.exit(1);
  });
}

export { APITester };