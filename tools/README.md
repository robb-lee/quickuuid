# Development Tools

This directory contains development and testing utilities for the UUID Generator application.

## Performance Tools

### `performance/benchmark.js`

Comprehensive performance benchmarking tool that tests UUID generation across multiple scenarios.

**Usage:**
```bash
node tools/performance/benchmark.js
```

**Test Scenarios:**
- Single UUID generation
- Batch generation (10, 100, 500, 1000, 5000 UUIDs)
- Performance validation (target: <50ms for 1000 UUIDs)
- UUID format validation
- Browser compatibility information

**Exit Codes:**
- `0`: All tests passed and performance is healthy
- `1`: Performance issues detected or tests failed

## Integration with Package Scripts

The benchmark tool is integrated with the main package.json scripts:

```bash
npm run perf:test    # Run performance benchmarks
```

## Previous Scripts (Deprecated)

The following scripts have been consolidated into the new benchmark tool:
- `scripts/performance-test.js` → `tools/performance/benchmark.js`
- `scripts/simple-perf-test.js` → `tools/performance/benchmark.js`
- `scripts/browser-compat-check.js` → `tools/performance/benchmark.js`

These can be safely removed as their functionality is now covered by the unified benchmark tool.