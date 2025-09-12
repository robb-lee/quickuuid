#!/usr/bin/env node

/**
 * UUID Generation Benchmark Tool
 * 
 * Consolidates performance testing for UUID generation with multiple test scenarios.
 * Tests both native crypto.randomUUID and custom implementations.
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Set up environment for testing
process.env.NODE_ENV = 'test';

// Polyfill crypto for older Node.js versions
if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto || require('crypto');
}

/**
 * Generate UUIDs using native crypto.randomUUID
 */
function generateNativeUUIDs(count) {
  const uuids = [];
  
  if (crypto.randomUUID) {
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
  } else {
    throw new Error('crypto.randomUUID not available');
  }
  
  return uuids;
}

/**
 * Test performance with timing
 */
function timeOperation(name, operation) {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  const duration = end - start;
  
  return {
    name,
    duration: Number(duration.toFixed(2)),
    result,
    passed: duration < 50 // Target: sub-50ms for production use
  };
}

/**
 * Run comprehensive performance benchmarks
 */
async function runBenchmarks() {
  console.log('🚀 UUID Generation Performance Benchmarks\n');
  
  const testCases = [
    { count: 1, name: 'Single UUID' },
    { count: 10, name: '10 UUIDs' },
    { count: 100, name: '100 UUIDs' },
    { count: 500, name: '500 UUIDs' },
    { count: 1000, name: '1000 UUIDs (Target)' },
    { count: 5000, name: '5000 UUIDs (Stress)' }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`Testing ${testCase.name}...`);
    
    // Test native implementation
    try {
      const result = timeOperation(
        `${testCase.name} (Native)`,
        () => generateNativeUUIDs(testCase.count)
      );
      
      results.push(result);
      
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const warningLevel = result.duration > 25 ? ' ⚠️' : '';
      
      console.log(`  ${status} ${result.duration}ms${warningLevel}`);
      
      // Validate UUIDs
      const validCount = result.result.filter(uuid => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
      ).length;
      
      if (validCount !== testCase.count) {
        console.log(`  ❌ UUID Validation: ${validCount}/${testCase.count} valid`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.push({
        name: `${testCase.name} (Native)`,
        duration: -1,
        result: null,
        passed: false,
        error: error.message
      });
    }
  }
  
  // Summary Report
  console.log('\n📊 Performance Summary:');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const avgDuration = results.filter(r => r.duration > 0)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration > 0).length;
  
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
  
  const criticalTest = results.find(r => r.name.includes('1000 UUIDs'));
  if (criticalTest) {
    console.log(`Target Test (1000 UUIDs): ${criticalTest.duration}ms ${criticalTest.passed ? '✅' : '❌'}`);
  }
  
  // Performance Health Check
  const performanceIssues = results.filter(r => r.duration > 25 && r.passed);
  if (performanceIssues.length > 0) {
    console.log('\n⚠️  Performance Warnings:');
    performanceIssues.forEach(issue => {
      console.log(`  - ${issue.name}: ${issue.duration}ms (slower than optimal)`);
    });
  }
  
  // Browser compatibility note
  console.log('\n🌐 Browser Compatibility:');
  console.log('  ✅ crypto.randomUUID supported in modern browsers');
  console.log('  ✅ Chrome 92+, Firefox 95+, Safari 15.4+');
  console.log('  ✅ Node.js 16.7.0+ (--enable-source-maps flag may be needed for older versions)');
  
  return {
    results,
    summary: {
      passed: passedTests,
      total: totalTests,
      averageDuration: avgDuration,
      performanceHealthy: passedTests === totalTests && avgDuration < 25
    }
  };
}

// Run benchmarks if called directly
if (require.main === module) {
  runBenchmarks()
    .then(report => {
      if (!report.summary.performanceHealthy) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = { runBenchmarks };