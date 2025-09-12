/**
 * E2E Test: Basic UUID Generation Workflow
 * 
 * Tests the complete user workflow for UUID generation.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('UUID Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display UUID generator interface', async ({ page }) => {
    // Should have main heading
    await expect(page.getByRole('heading', { name: /uuid generator/i })).toBeVisible();
    
    // Should have count input
    await expect(page.getByLabel(/count/i)).toBeVisible();
    
    // Should have format options
    await expect(page.getByLabel(/include hyphens/i)).toBeVisible();
    await expect(page.getByLabel(/uppercase/i)).toBeVisible();
    
    // Should have generated UUIDs display area
    await expect(page.getByTestId('uuid-results')).toBeVisible();
  });

  test('should generate single UUID by default', async ({ page }) => {
    // Should automatically generate one UUID on load
    const uuidResults = page.getByTestId('uuid-results');
    await expect(uuidResults).toBeVisible();
    
    // Should contain a valid UUID
    const uuidText = await uuidResults.textContent();
    expect(uuidText).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });

  test('should update UUID count and regenerate automatically', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    const uuidResults = page.getByTestId('uuid-results');
    
    // Change count to 3
    await countInput.fill('3');
    
    // Wait for generation to complete
    await page.waitForTimeout(500);
    
    // Should automatically regenerate with 3 UUIDs
    await expect(uuidResults).toBeVisible();
    
    // Count individual UUID items (they have numbered badges)
    const individualUuids = page.locator('[data-testid="uuid-results"] code');
    await expect(individualUuids).toHaveCount(3);
  });

  test('should handle maximum UUID count', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    const uuidResults = page.getByTestId('uuid-results');
    
    // Set count to maximum (1000)
    await countInput.fill('1000');
    
    // Should handle large number of UUIDs
    await expect(uuidResults).toBeVisible();
    const resultsText = await uuidResults.textContent();
    
    // Should contain 1000 UUIDs
    const uuidMatches = resultsText?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
    expect(uuidMatches).toHaveLength(1000);
  });

  test('should validate count input', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    
    // Test invalid count (0)
    await countInput.fill('0');
    await expect(page.getByText(/count must be between 1 and 1000/i)).toBeVisible();
    
    // Test invalid count (over maximum)
    await countInput.fill('1001');
    await expect(page.getByText(/count must be between 1 and 1000/i)).toBeVisible();
    
    // Test valid count should clear error
    await countInput.fill('5');
    await expect(page.getByText(/count must be between 1 and 1000/i)).not.toBeVisible();
  });

  test('should apply formatting options in real-time', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Remove hyphens
    await page.getByLabel(/include hyphens/i).uncheck();
    
    // Should update display without hyphens
    const resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain('-');
    expect(resultsText).toMatch(/[0-9a-f]{32}/); // 32 characters without hyphens
  });

  test('should convert to uppercase when requested', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Enable uppercase
    await page.getByLabel(/uppercase/i).check();
    
    // Should display uppercase UUIDs
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toMatch(/[0-9A-F-]/);
    expect(resultsText).not.toMatch(/[a-f]/);
  });

  test('should add braces when requested', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Enable braces
    await page.getByLabel(/include braces/i).check();
    
    // Should display UUIDs with braces
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('{');
    expect(resultsText).toContain('}');
    expect(resultsText).toMatch(/\\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\}/);
  });

  test('should add quotes when requested', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Enable quotes
    await page.getByLabel(/include quotes/i).check();
    
    // Should display UUIDs with quotes
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('\"');
    expect(resultsText).toMatch(/\"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\"/);
  });

  test('should separate multiple UUIDs with commas when requested', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    const uuidResults = page.getByTestId('uuid-results');
    
    // Set count to 3
    await countInput.fill('3');
    
    // Enable comma separation
    await page.getByLabel(/separate with commas/i).check();
    
    // Should display UUIDs separated by commas
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toContain(',');
    
    // Should have 2 commas for 3 UUIDs
    const commaCount = (resultsText?.match(/,/g) || []).length;
    expect(commaCount).toBe(2);
  });

  test('should combine multiple formatting options', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    const uuidResults = page.getByTestId('uuid-results');
    
    // Set count to 2
    await countInput.fill('2');
    
    // Enable all formatting options
    await page.getByLabel(/include hyphens/i).uncheck(); // Remove hyphens
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/include quotes/i).check();
    await page.getByLabel(/uppercase/i).check();
    await page.getByLabel(/separate with commas/i).check();
    
    // Should display formatted UUIDs: "{\"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\"}","{\"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\"}"
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('{');
    expect(resultsText).toContain('}');
    expect(resultsText).toContain('\"');
    expect(resultsText).toContain(',');
    expect(resultsText).not.toContain('-');
    expect(resultsText).toMatch(/[0-9A-F]/);
    expect(resultsText).not.toMatch(/[a-f]/);
  });

  test('should maintain UUID uniqueness', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    const uuidResults = page.getByTestId('uuid-results');
    
    // Generate 100 UUIDs
    await countInput.fill('100');
    
    const resultsText = await uuidResults.textContent();
    const uuidMatches = resultsText?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
    
    // All UUIDs should be unique
    const uniqueUUIDs = new Set(uuidMatches);
    expect(uniqueUUIDs.size).toBe(uuidMatches.length);
  });

  test('should display generation timestamp', async ({ page }) => {
    // Should show when UUIDs were generated
    await expect(page.getByTestId('generation-timestamp')).toBeVisible();
    
    const timestampText = await page.getByTestId('generation-timestamp').textContent();
    expect(timestampText).toContain('Generated at');
  });

  test('should show performance metrics for large generations', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    
    // Generate 1000 UUIDs to trigger performance display
    await countInput.fill('1000');
    
    // Should show performance metrics
    await expect(page.getByTestId('performance-metrics')).toBeVisible();
    
    const metricsText = await page.getByTestId('performance-metrics').textContent();
    expect(metricsText).toMatch(/Generated in \\d+ms/);
  });

  test('should handle crypto API unavailable gracefully', async ({ page, context }) => {
    // Mock crypto.randomUUID as unavailable
    await context.addInitScript(() => {
      // @ts-ignore
      delete window.crypto.randomUUID;
    });
    
    await page.goto('/');
    
    // Should show fallback warning
    await expect(page.getByText(/crypto api unavailable/i)).toBeVisible();
    
    // Should still generate UUIDs with fallback
    const uuidResults = page.getByTestId('uuid-results');
    await expect(uuidResults).toBeVisible();
    
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });
});