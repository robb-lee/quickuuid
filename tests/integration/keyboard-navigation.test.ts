/**
 * Integration Test: Keyboard Navigation
 * 
 * Tests keyboard navigation and accessibility features.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support tab navigation through all interactive elements', async ({ page }) => {
    // Start from beginning
    await page.keyboard.press('Tab');
    
    // Should focus on count input
    const countInput = page.getByLabel(/count/i);
    await expect(countInput).toBeFocused();
    
    // Continue tabbing through format options
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/include hyphens/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/include braces/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/include quotes/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/uppercase/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/separate with commas/i)).toBeFocused();
    
    // Tab to copy buttons
    await page.keyboard.press('Tab');
    const copyAllButton = page.getByTestId('copy-all-button');
    await expect(copyAllButton).toBeFocused();
    
    // Tab to theme toggle
    await page.keyboard.press('Tab');
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(themeToggle).toBeFocused();
  });

  test('should support reverse tab navigation', async ({ page }) => {
    // Focus on last element first
    const themeToggle = page.getByTestId('theme-toggle');
    await themeToggle.focus();
    
    // Shift+Tab should go backwards
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('copy-all-button')).toBeFocused();
    
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByLabel(/separate with commas/i)).toBeFocused();
  });

  test('should activate checkboxes with space key', async ({ page }) => {
    // Focus on a checkbox
    const bracesCheckbox = page.getByLabel(/include braces/i);
    await bracesCheckbox.focus();
    
    // Should not be checked initially
    await expect(bracesCheckbox).not.toBeChecked();
    
    // Press space to toggle
    await page.keyboard.press('Space');
    
    // Should be checked now
    await expect(bracesCheckbox).toBeChecked();
    
    // Should update UUIDs display
    const uuidResults = page.getByTestId('uuid-results');
    const resultsText = await uuidResults.textContent();
    expect(resultsText).toContain('{');
  });

  test('should activate buttons with enter and space', async ({ page }) => {
    const copyAllButton = page.getByTestId('copy-all-button');
    await copyAllButton.focus();
    
    // Press Enter to activate
    await page.keyboard.press('Enter');
    
    // Should show copy feedback
    await expect(page.getByText(/copied/i)).toBeVisible();
    
    // Wait for feedback to clear
    await page.waitForTimeout(3000);
    
    // Press Space to activate again
    await page.keyboard.press('Space');
    await expect(page.getByText(/copied/i)).toBeVisible();
  });

  test('should support arrow keys for count input', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    await countInput.focus();
    
    // Clear and set initial value
    await countInput.fill('5');
    
    // Arrow up should increase
    await page.keyboard.press('ArrowUp');
    await expect(countInput).toHaveValue('6');
    
    // Arrow down should decrease
    await page.keyboard.press('ArrowDown');
    await expect(countInput).toHaveValue('5');
  });

  test('should support home/end keys for count input', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    await countInput.focus();
    
    await countInput.fill('123');
    
    // Home should go to beginning
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');
    await expect(countInput).toHaveValue('23');
    
    // End should go to end
    await page.keyboard.press('End');
    await page.keyboard.press('Backspace');
    await expect(countInput).toHaveValue('2');
  });

  test('should support escape key to clear focus', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    await countInput.focus();
    
    await expect(countInput).toBeFocused();
    
    // Escape should remove focus
    await page.keyboard.press('Escape');
    
    // Should not be focused anymore
    await expect(countInput).not.toBeFocused();
  });


  test('should support enter key to regenerate UUIDs', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    await countInput.focus();
    
    // Get initial UUIDs
    const initialText = await page.getByTestId('uuid-results').textContent();
    
    // Press Enter to regenerate
    await page.keyboard.press('Enter');
    
    // Should regenerate UUIDs
    const newText = await page.getByTestId('uuid-results').textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should show focus indicators on all interactive elements', async ({ page }) => {
    // Tab through elements and check focus indicators
    const focusableElements = [
      page.getByLabel(/count/i),
      page.getByLabel(/include hyphens/i),
      page.getByLabel(/include braces/i),
      page.getByTestId('copy-all-button'),
      page.getByTestId('theme-toggle')
    ];
    
    for (const element of focusableElements) {
      await element.focus();
      
      // Should have focus ring or outline
      const outline = await element.evaluate(el => getComputedStyle(el).outline);
      const boxShadow = await element.evaluate(el => getComputedStyle(el).boxShadow);
      
      // Should have visible focus indicator
      expect(outline !== 'none' || boxShadow !== 'none').toBe(true);
    }
  });

  test('should support skip links for screen readers', async ({ page }) => {
    // Tab from beginning should show skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.getByText(/skip to main content|skip to results/i);
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeFocused();
      
      // Enter should skip to main content
      await page.keyboard.press('Enter');
      
      const mainContent = page.getByTestId('uuid-results');
      await expect(mainContent).toBeFocused();
    }
  });

  test('should handle rapid keyboard input gracefully', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    await countInput.focus();
    
    // Rapidly press keys
    await countInput.fill('');
    await page.keyboard.type('12345', { delay: 10 });
    
    // Should handle input correctly
    await expect(countInput).toHaveValue('12345');
    
    // Should generate correct number of UUIDs
    const uuidResults = page.getByTestId('uuid-results');
    const resultsText = await uuidResults.textContent();
    const uuidCount = (resultsText?.match(/[0-9a-f-]{36}/g) || []).length;
    expect(uuidCount).toBe(12345);
  });


  test('should provide keyboard alternatives for mouse actions', async ({ page }) => {
    // All mouse actions should have keyboard equivalents
    
    // Copy individual UUID with keyboard
    const firstCopyButton = page.getByTestId('copy-single-button').first();
    if (await firstCopyButton.isVisible()) {
      await firstCopyButton.focus();
      await page.keyboard.press('Enter');
      
      await expect(page.getByText(/copied/i)).toBeVisible();
    }
    
    // Select format options with keyboard
    const uppercaseCheckbox = page.getByLabel(/uppercase/i);
    await uppercaseCheckbox.focus();
    await page.keyboard.press('Space');
    
    await expect(uppercaseCheckbox).toBeChecked();
  });

  test('should announce changes to screen readers', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegion = page.getByTestId('screen-reader-announcements');
    if (await liveRegion.isVisible()) {
      // Change count and check announcement
      await page.getByLabel(/count/i).fill('5');
      
      const announcement = await liveRegion.textContent();
      expect(announcement).toMatch(/5 uuids generated/i);
    }
  });

  test('should handle keyboard navigation in modal dialogs', async ({ page }) => {
    // Open settings or help modal if available
    const settingsButton = page.getByTestId('settings-button');
    if (await settingsButton.isVisible()) {
      await settingsButton.focus();
      await page.keyboard.press('Enter');
      
      // Should trap focus in modal
      const modal = page.getByTestId('settings-modal');
      await expect(modal).toBeVisible();
      
      // Tab should cycle within modal
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      
      // Should be within modal
      const isWithinModal = await modal.evaluate((modal, focused) => {
        return modal.contains(focused);
      }, await focusedElement.elementHandle());
      
      expect(isWithinModal).toBe(true);
      
      // Escape should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });
});