#!/usr/bin/env node

/**
 * Performance Test Script
 * 
 * Tests UUID generation performance to ensure it meets the sub-50ms requirement for 1000 UUIDs.
 */

// Mock browser environment for Node.js
global.crypto = require('crypto').webcrypto || require('crypto');

const { createUUIDGenerator } = require('../src/lib/uuid-generator.ts');
const { createFormatUtils } = require('../src/lib/format-utils.ts');

async function performanceTest() {
  console.log('🚀 UUID Generator Performance Test\n');

  const generator = createUUIDGenerator();
  const formatter = createFormatUtils();

  // Test configurations
  const tests = [
    { count: 1, name: 'Single UUID' },
    { count: 10, name: '10 UUIDs' },
    { count: 100, name: '100 UUIDs' },
    { count: 500, name: '500 UUIDs' },
    { count: 1000, name: '1000 UUIDs (Target)' },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    
    // Warm up
    await generator.generateUUIDs({ count: 1, version: 'v4' });
    
    // Performance test
    const startTime = performance.now();
    
    try {
      const uuids = await generator.generateUUIDs({ 
        count: test.count, 
        version: 'v4' 
      });
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Test formatting performance
      const formatStartTime = performance.now();
      const formatted = formatter.formatUUIDs(uuids, {
        includeHyphens: true,
        includeBraces: false,
        includeQuotes: false,
        upperCase: false,
        separateWithCommas: true
      });
      const formatEndTime = performance.now();
      const formatTime = formatEndTime - formatStartTime;
      
      const totalTime = generationTime + formatTime;
      
      results.push({
        count: test.count,
        name: test.name,
        generationTime: generationTime.toFixed(2),
        formatTime: formatTime.toFixed(2),
        totalTime: totalTime.toFixed(2),
        passed: test.count === 1000 ? totalTime < 50 : true
      });
      
      console.log(`  ✅ Generated ${test.count} UUIDs`);
      console.log(`     Generation: ${generationTime.toFixed(2)}ms`);
      console.log(`     Formatting: ${formatTime.toFixed(2)}ms`);
      console.log(`     Total: ${totalTime.toFixed(2)}ms`);
      
      if (test.count === 1000) {
        if (totalTime < 50) {
          console.log(`  🎯 TARGET MET: ${totalTime.toFixed(2)}ms < 50ms`);
        } else {
          console.log(`  ❌ TARGET MISSED: ${totalTime.toFixed(2)}ms > 50ms`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}\n`);
      results.push({
        count: test.count,
        name: test.name,
        error: error.message,
        passed: false
      });
    }
  }

  // Summary
  console.log('📊 Performance Test Summary');
  console.log('============================');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`${result.name}: ❌ FAILED - ${result.error}`);
    } else {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${result.name}: ${status} - ${result.totalTime}ms total (${result.generationTime}ms gen + ${result.formatTime}ms fmt)`);
    }
  });

  // Overall result
  const targetTest = results.find(r => r.count === 1000);
  if (targetTest && targetTest.passed) {
    console.log('\n🎉 PERFORMANCE TARGET ACHIEVED!');
    console.log(`1000 UUIDs generated and formatted in ${targetTest.totalTime}ms (< 50ms target)`);
    process.exit(0);
  } else {
    console.log('\n⚠️  PERFORMANCE TARGET NOT MET');
    console.log('Consider optimizing UUID generation or formatting logic');
    process.exit(1);
  }
}

// Run the test
performanceTest().catch(console.error);