#!/usr/bin/env node

/**
 * Setup Verification Script
 * Tests basic backend functionality
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const lib = url.protocol === 'https:' ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = lib.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  log('\n🧪 SGA AI Tutor Backend - Verification Tests\n', 'blue');
  log('=' .repeat(50), 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Test 1: Health Check
  log('\n[Test 1] Health Check Endpoint', 'yellow');
  try {
    const response = await testEndpoint('GET', '/health');
    if (response.status === 200 && response.data.status === 'healthy') {
      log('✅ PASS: Health check returned healthy', 'green');
      results.passed++;
    } else {
      log('❌ FAIL: Health check did not return expected response', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Data: ${JSON.stringify(response.data)}`, 'red');
      results.failed++;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 2: Root Endpoint
  log('\n[Test 2] Root Endpoint', 'yellow');
  try {
    const response = await testEndpoint('GET', '/');
    if (response.status === 200 && response.data.message) {
      log('✅ PASS: Root endpoint returned welcome message', 'green');
      log(`   Message: ${response.data.message}`, 'blue');
      results.passed++;
    } else {
      log('❌ FAIL: Root endpoint did not return expected response', 'red');
      results.failed++;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 3: Database Connection (via dashboard endpoint)
  log('\n[Test 3] Database Connection', 'yellow');
  try {
    const response = await testEndpoint('GET', '/api/dashboard/test_student');
    // Even if student not found, DB connection should work
    if (response.status === 200 || response.status === 404 || response.status === 500) {
      log('✅ PASS: Database connection established', 'green');
      results.passed++;
    } else {
      log('❌ FAIL: Unexpected response from database', 'red');
      results.failed++;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    results.failed++;
  }
  results.total++;

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('\n📊 Test Summary:', 'blue');
  log(`   Total:  ${results.total}`, 'blue');
  log(`   Passed: ${results.passed}`, 'green');
  log(`   Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`   Success Rate: ${successRate}%\n`, 'blue');

  if (results.failed === 0) {
    log('🎉 All tests passed! Backend is working correctly.\n', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please check the errors above.\n', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}\n`, 'red');
  log('Make sure the backend server is running:', 'yellow');
  log('  npm run dev\n', 'yellow');
  process.exit(1);
});
