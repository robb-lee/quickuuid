#!/usr/bin/env node

/**
 * Simple Performance Test
 * 
 * Tests native UUID generation performance in Node.js
 */

const { performance } = require('perf_hooks');

// Polyfill crypto.randomUUID for older Node.js versions
if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto || require('crypto');
}

function generateUUIDs(count) {
  const uuids = [];
  
  if (crypto.randomUUID) {
    // Use native crypto.randomUUID (fastest)
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
  } else if (crypto.getRandomValues) {
    // Use crypto.getRandomValues (fallback)
    for (let i = 0; i < count; i++) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      
      // Set version (4 bits)
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // Set variant (2 bits)  
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      
      // Convert to hex string with hyphens
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      const uuid = [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32)
      ].join('-');
      
      uuids.push(uuid);
    }
  } else {
    throw new Error('Crypto API not available');
  }
  
  return uuids;
}

function formatUUIDs(uuids, options = {}) {
  const {
    includeHyphens = true,
    includeBraces = false,
    includeQuotes = false,
    upperCase = false,
    separateWithCommas = false
  } = options;
  
  const formatted = uuids.map(uuid => {
    let result = uuid;
    
    if (!includeHyphens) {
      result = result.replace(/-/g, '');
    }
    
    if (includeBraces) {
      result = `{${result}}`;
    }
    
    if (includeQuotes) {
      result = `"${result}"`;
    }
    
    if (upperCase) {
      result = result.toUpperCase();
    }
    
    return result;
  });
  
  return separateWithCommas ? formatted.join(', ') : formatted.join('\n');
}

async function runPerformanceTest() {
  console.log('🚀 UUID Generator Performance Test\n');
  
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
    
    try {
      // Warm up
      generateUUIDs(1);
      
      // Generation performance test
      const startTime = performance.now();
      const uuids = generateUUIDs(test.count);
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Formatting performance test
      const formatStartTime = performance.now();
      const formatted = formatUUIDs(uuids, {
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
    return true;
  } else {
    console.log('\n⚠️  PERFORMANCE TARGET NOT MET');
    console.log('Consider optimizing UUID generation or formatting logic');
    return false;
  }
}

// Run the test
runPerformanceTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });