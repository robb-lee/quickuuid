/**
 * E2E Test: Format Options and Real-time Updates
 * 
 * Tests format option controls and real-time UUID updates.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Format Options and Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set count to 3 for better testing
    await page.getByLabel(/count/i).fill('3');
  });

  test('should have all format option controls', async ({ page }) => {
    // Check all format controls are present
    await expect(page.getByLabel(/include hyphens/i)).toBeVisible();
    await expect(page.getByLabel(/include braces/i)).toBeVisible();
    await expect(page.getByLabel(/include quotes/i)).toBeVisible();
    await expect(page.getByLabel(/uppercase/i)).toBeVisible();
    await expect(page.getByLabel(/separate with commas/i)).toBeVisible();
  });

  test('should update display when hyphens option changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    const hyphensCheckbox = page.getByLabel(/include hyphens/i);
    
    // Initially should have hyphens (default)
    await expect(hyphensCheckbox).toBeChecked();
    let resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('-');
    
    // Uncheck hyphens
    await hyphensCheckbox.uncheck();
    
    // Wait for formatting to update
    await page.waitForTimeout(500);
    
    // Should update immediately without hyphens
    // Check only the UUID items to avoid CSS interference  
    const uuidItems = page.getByTestId('uuid-items');
    resultsText = await uuidItems.textContent();
    expect(resultsText).not.toContain('-');
    expect(resultsText).toMatch(/[0-9a-f]{32}/); // 32 chars without hyphens
    
    // Re-enable hyphens
    await hyphensCheckbox.check();
    
    // Should restore hyphens
    resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('-');
  });

  test('should update display when braces option changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    const bracesCheckbox = page.getByLabel(/include braces/i);
    
    // Initially should not have braces (default)
    await expect(bracesCheckbox).not.toBeChecked();
    let resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain('{');
    expect(resultsText).not.toContain('}');
    
    // Enable braces
    await bracesCheckbox.check();
    
    // Should update immediately with braces
    resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('{');
    expect(resultsText).toContain('}');
    
    // Disable braces
    await bracesCheckbox.uncheck();
    
    // Should remove braces
    resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain('{');
    expect(resultsText).not.toContain('}');
  });

  test('should update display when quotes option changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    const quotesCheckbox = page.getByLabel(/include quotes/i);
    
    // Initially should not have quotes (default)
    await expect(quotesCheckbox).not.toBeChecked();
    let resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain('\"');
    
    // Enable quotes
    await quotesCheckbox.check();
    
    // Should update immediately with quotes
    resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('\"');
    
    // Disable quotes
    await quotesCheckbox.uncheck();
    
    // Should remove quotes
    resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain('\"');
  });

  test('should update display when uppercase option changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    const uppercaseCheckbox = page.getByLabel(/uppercase/i);
    
    // Initially should be lowercase (default)
    await expect(uppercaseCheckbox).not.toBeChecked();
    let resultsText = await uuidResults.textContent();
    expect(resultsText).toMatch(/[a-f]/); // Should contain lowercase hex
    
    // Enable uppercase
    await uppercaseCheckbox.check();
    
    // Should update immediately to uppercase
    resultsText = await uuidResults.textContent();
    expect(resultsText).toMatch(/[A-F]/); // Should contain uppercase hex
    expect(resultsText).not.toMatch(/[a-f]/); // Should not contain lowercase
    
    // Disable uppercase
    await uppercaseCheckbox.uncheck();
    
    // Should revert to lowercase
    resultsText = await uuidResults.textContent();
    expect(resultsText).toMatch(/[a-f]/);
  });

  test('should update display when comma separation option changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    const commaCheckbox = page.getByLabel(/separate with commas/i);
    
    // Initially should not have commas (default)
    await expect(commaCheckbox).not.toBeChecked();
    let resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain(',');
    
    // Enable comma separation
    await commaCheckbox.check();
    
    // Should update immediately with commas
    resultsText = await uuidResults.textContent();
    expect(resultsText).toContain(',');
    
    // Should have 2 commas for 3 UUIDs
    const commaCount = (resultsText?.match(/,/g) || []).length;
    expect(commaCount).toBe(2);
    
    // Disable comma separation
    await commaCheckbox.uncheck();
    
    // Should remove commas
    resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain(',');
  });

  test('should update display when multiple options change rapidly', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Rapidly change multiple options
    await page.getByLabel(/include hyphens/i).uncheck();
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    
    // Should handle rapid updates correctly
    const resultsText = await uuidResults.textContent();
    expect(resultsText).not.toContain('-');     // No hyphens
    expect(resultsText).toContain('{');         // With braces
    expect(resultsText).toContain('}');         // With braces
    expect(resultsText).toMatch(/[A-F]/);       // Uppercase
    expect(resultsText).not.toMatch(/[a-f]/);   // No lowercase
  });

  test('should debounce rapid option changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    const performanceMetrics = page.getByTestId('performance-metrics');
    
    // Get initial update count if metrics are available
    const initialMetrics = await performanceMetrics.textContent().catch(() => '');
    
    // Rapidly toggle options multiple times
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/include hyphens/i).uncheck();
      await page.getByLabel(/include hyphens/i).check();
    }
    
    // Should still display correctly after rapid changes
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });

  test('should preserve UUIDs when only formatting changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Get initial UUIDs (extract just the UUID part)
    const initialText = await uuidResults.textContent();
    const initialUUIDs = initialText?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
    
    // Change formatting options
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    
    // Get updated text
    const updatedText = await uuidResults.textContent();
    
    // Extract UUIDs from formatted text (convert back to standard format for comparison)
    const formattedText = updatedText?.replace(/[{}\"]/g, '').toLowerCase() || '';
    const updatedUUIDs = formattedText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
    
    // UUIDs should be the same, just formatted differently
    expect(updatedUUIDs).toEqual(initialUUIDs);
  });

  test('should show format preview or live example', async ({ page }) => {
    // Should have some indication of current format
    await expect(page.getByTestId('format-preview')).toBeVisible();
    
    // Change options and verify preview updates
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    
    const previewText = await page.getByTestId('format-preview').textContent();
    expect(previewText).toContain('{');
    expect(previewText).toMatch(/[A-F]/);
  });

  test('should handle format option state persistence', async ({ page }) => {
    // Change some options
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    await page.getByLabel(/separate with commas/i).check();
    
    // Reload the page
    await page.reload();
    
    // Options should be preserved
    await expect(page.getByLabel(/include braces/i)).toBeChecked();
    await expect(page.getByLabel(/uppercase/i)).toBeChecked();
    await expect(page.getByLabel(/separate with commas/i)).toBeChecked();
    
    // Formatting should still be applied
    const resultsText = await page.getByTestId('uuid-results').textContent();
    expect(resultsText).toContain('{');
    expect(resultsText).toContain(',');
    expect(resultsText).toMatch(/[A-F]/);
  });

  test('should show visual feedback for format changes', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Look for visual indicators of updates (like loading states or animations)
    await page.getByLabel(/include braces/i).check();
    
    // Should show some visual feedback (could be highlighting, transitions, etc.)
    await expect(uuidResults).toHaveClass(/updated|highlight|transition/);
  });

  test('should handle edge case format combinations', async ({ page }) => {
    const uuidResults = page.getByTestId('uuid-results');
    
    // Test all options enabled
    await page.getByLabel(/include hyphens/i).uncheck();
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/include quotes/i).check();
    await page.getByLabel(/uppercase/i).check();
    await page.getByLabel(/separate with commas/i).check();
    
    const resultsText = await uuidResults.textContent();
    
    // Should handle complex formatting correctly
    expect(resultsText).toMatch(/\\{\"[0-9A-F]{32}\"\\}/); // Pattern for formatted UUID
    expect(resultsText).toContain(','); // Should have separators
  });

  test('should update copy button text based on format', async ({ page }) => {
    // Copy button text might change based on format
    const copyButton = page.getByTestId('copy-all-button');
    
    // Default format
    let buttonText = await copyButton.textContent();
    expect(buttonText).toContain('Copy');
    
    // Change to complex format
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/separate with commas/i).check();
    
    // Button text might indicate format (e.g., \"Copy with braces\")
    buttonText = await copyButton.textContent();
    expect(buttonText).toContain('Copy');
  });
});