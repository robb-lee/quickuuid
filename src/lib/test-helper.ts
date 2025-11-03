/**
 * Test helper utilities for GitHub Actions validation
 */

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function generateTestId(): string {
  return `test-${Date.now()}`;
}

export const TEST_CONFIG = {
  maxRetries: 3,
  timeout: 5000,
} as const;
