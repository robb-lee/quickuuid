/**
 * E2E Test: Copy Operations (Single and Bulk)
 * 
 * Tests clipboard functionality for UUID copying.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Copy Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set count to 3 for testing
    await page.getByLabel(/count/i).fill('3');
  });

  test('should have copy all button', async ({ page }) => {
    const copyAllButton = page.getByTestId('copy-all-button');
    await expect(copyAllButton).toBeVisible();
    await expect(copyAllButton).toContainText(/copy all/i);
  });

  test('should copy all UUIDs to clipboard', async ({ page }) => {
    const copyAllButton = page.getByTestId('copy-all-button');
    
    // Click copy all button
    await copyAllButton.click();
    
    // Should show success feedback
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
    
    // Verify clipboard contains UUIDs
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    // Should contain 3 UUIDs
    const uuidMatches = clipboardText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
    expect(uuidMatches).toHaveLength(3);
  });

  test('should copy formatted UUIDs based on current options', async ({ page }) => {
    // Enable formatting options
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    await page.getByLabel(/separate with commas/i).check();
    
    const copyAllButton = page.getByTestId('copy-all-button');
    await copyAllButton.click();
    
    // Verify clipboard contains formatted UUIDs
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    expect(clipboardText).toContain('{');
    expect(clipboardText).toContain('}');
    expect(clipboardText).toContain(',');
    expect(clipboardText).toMatch(/[A-F]/);
    expect(clipboardText).not.toMatch(/[a-f]/);
  });

  test('should have individual copy buttons for each UUID', async ({ page }) => {
    const copyButtons = page.getByTestId('copy-single-button');
    
    // Should have 3 copy buttons (one for each UUID)
    await expect(copyButtons).toHaveCount(3);
    
    // Each should be visible
    for (let i = 0; i < 3; i++) {
      await expect(copyButtons.nth(i)).toBeVisible();
    }
  });

  test('should copy individual UUID', async ({ page }) => {
    const copyButtons = page.getByTestId('copy-single-button');
    const uuidResults = page.getByTestId('uuid-results');
    
    // Get the first UUID from display
    const resultsText = await uuidResults.textContent();
    const uuids = resultsText?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
    const firstUUID = uuids[0];
    
    // Click first copy button
    await copyButtons.nth(0).click();
    
    // Wait a moment for copy operation to complete
    await page.waitForTimeout(100);
    
    // Verify clipboard contains the specific UUID
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    expect(clipboardText).toContain(firstUUID);
  });

  test('should copy individual UUID with current formatting', async ({ page }) => {
    // Enable braces and uppercase
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    
    const copyButtons = page.getByTestId('copy-single-button');
    
    // Click first copy button
    await copyButtons.nth(0).click();
    
    // Verify clipboard contains formatted UUID
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    expect(clipboardText).toContain('{');
    expect(clipboardText).toContain('}');
    expect(clipboardText).toMatch(/[A-F]/);
  });

  test('should show different feedback for single vs bulk copy', async ({ page }) => {
    const copyAllButton = page.getByTestId('copy-all-button');
    const copyButtons = page.getByTestId('copy-single-button');
    
    // Test bulk copy feedback
    await copyAllButton.click();
    await expect(page.getByText(/3 UUIDs copied/i)).toBeVisible();
    
    // Wait for feedback to clear
    await page.waitForTimeout(3000);
    
    // Test single copy feedback
    await copyButtons.nth(0).click();
    await expect(page.getByText(/UUID copied/i)).toBeVisible();
  });

  test('should handle copy operation failures gracefully', async ({ page, context }) => {
    // Mock clipboard to be unavailable
    await context.addInitScript(() => {
      // @ts-ignore
      delete navigator.clipboard;
    });
    
    await page.goto('/');
    await page.getByLabel(/count/i).fill('2');
    
    const copyAllButton = page.getByTestId('copy-all-button');
    await copyAllButton.click();
    
    // Should show error feedback
    await expect(page.getByText(/copy failed|clipboard unavailable/i)).toBeVisible();
  });

  test('should handle clipboard permissions denied', async ({ page, context }) => {
    // Mock clipboard to throw permission error
    await context.addInitScript(() => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText = async () => {
          throw new DOMException('Permission denied', 'NotAllowedError');
        };
      }
    });
    
    await page.goto('/');
    const copyAllButton = page.getByTestId('copy-all-button');
    await copyAllButton.click();
    
    // Should show permission error feedback
    await expect(page.getByText(/permission denied|clipboard access denied/i)).toBeVisible();
  });

  test('should provide fallback copy method when clipboard unavailable', async ({ page, context }) => {
    // Mock clipboard as unavailable
    await context.addInitScript(() => {
      // @ts-ignore
      delete navigator.clipboard;
    });
    
    await page.goto('/');
    const copyAllButton = page.getByTestId('copy-all-button');
    await copyAllButton.click();
    
    // Should show fallback instruction or select text
    await expect(page.getByText(/text selected|use ctrl\\+c|manual copy/i)).toBeVisible();
  });

  test('should track copy history', async ({ page }) => {
    const copyAllButton = page.getByTestId('copy-all-button');
    const copyButtons = page.getByTestId('copy-single-button');
    
    // Perform multiple copy operations
    await copyAllButton.click();
    await page.waitForTimeout(1000);
    await copyButtons.nth(0).click();
    
    // Should show copy history (if implemented)
    const historyButton = page.getByTestId('copy-history-button');
    if (await historyButton.isVisible()) {
      await historyButton.click();
      await expect(page.getByTestId('copy-history')).toBeVisible();
    }
  });

  test('should disable copy buttons when no UUIDs generated', async ({ page, context }) => {
    // Mock generation to fail
    await context.addInitScript(() => {
      // @ts-ignore
      delete window.crypto.randomUUID;
      // @ts-ignore
      delete window.crypto.getRandomValues;
    });
    
    await page.goto('/');
    
    const copyAllButton = page.getByTestId('copy-all-button');
    
    // Copy button should be disabled when no UUIDs
    await expect(copyAllButton).toBeDisabled();
  });

  test('should show keyboard shortcuts for copy operations', async ({ page }) => {
    // Look for keyboard shortcut hints
    await expect(page.getByText(/ctrl\\+c|cmd\\+c/i)).toBeVisible();
  });

  test('should handle rapid copy operations', async ({ page }) => {
    const copyButtons = page.getByTestId('copy-single-button');
    
    // Rapidly click multiple copy buttons
    await Promise.all([
      copyButtons.nth(0).click(),
      copyButtons.nth(1).click(),
      copyButtons.nth(2).click()
    ]);
    
    // Should handle all operations gracefully
    await expect(page.getByText(/copied/i)).toBeVisible();
  });

  test('should copy large number of UUIDs efficiently', async ({ page }) => {
    // Generate 1000 UUIDs
    await page.getByLabel(/count/i).fill('1000');
    
    const copyAllButton = page.getByTestId('copy-all-button');
    
    // Measure copy operation time
    const startTime = Date.now();
    await copyAllButton.click();
    
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
    const endTime = Date.now();
    
    // Should complete within reasonable time
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // 5 seconds max
    
    // Verify clipboard contains all UUIDs
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    const uuidMatches = clipboardText.match(/[0-9a-f-]{36}/g) || [];
    expect(uuidMatches).toHaveLength(1000);
  });

  test('should provide copy feedback with animation', async ({ page }) => {
    const copyAllButton = page.getByTestId('copy-all-button');
    
    await copyAllButton.click();
    
    // Should show animated feedback
    const feedback = page.getByTestId('copy-feedback');
    await expect(feedback).toHaveClass(/fade|slide|bounce/);
    
    // Feedback should auto-hide after timeout
    await page.waitForTimeout(4000);
    await expect(feedback).not.toBeVisible();
  });
});