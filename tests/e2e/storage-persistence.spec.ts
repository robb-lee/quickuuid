/**
 * E2E Test: localStorage Persistence
 * 
 * Tests user preference persistence across sessions.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Storage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should load with default settings on first visit', async ({ page }) => {
    // Should have default values
    await expect(page.getByLabel(/count/i)).toHaveValue('1');
    await expect(page.getByLabel(/include hyphens/i)).toBeChecked();
    await expect(page.getByLabel(/include braces/i)).not.toBeChecked();
    await expect(page.getByLabel(/include quotes/i)).not.toBeChecked();
    await expect(page.getByLabel(/uppercase/i)).not.toBeChecked();
    await expect(page.getByLabel(/separate with commas/i)).not.toBeChecked();
  });

  test('should persist count setting', async ({ page }) => {
    // Change count
    await page.getByLabel(/count/i).fill('5');
    
    // Reload page
    await page.reload();
    
    // Count should be preserved
    await expect(page.getByLabel(/count/i)).toHaveValue('5');
  });

  test('should persist format options', async ({ page }) => {
    // Change format options
    await page.getByLabel(/include hyphens/i).uncheck();
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/include quotes/i).check();
    await page.getByLabel(/uppercase/i).check();
    await page.getByLabel(/separate with commas/i).check();
    
    // Reload page
    await page.reload();
    
    // All options should be preserved
    await expect(page.getByLabel(/include hyphens/i)).not.toBeChecked();
    await expect(page.getByLabel(/include braces/i)).toBeChecked();
    await expect(page.getByLabel(/include quotes/i)).toBeChecked();
    await expect(page.getByLabel(/uppercase/i)).toBeChecked();
    await expect(page.getByLabel(/separate with commas/i)).toBeChecked();
  });

  test('should persist theme setting', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Change to dark theme
    await themeToggle.click();
    
    // Should apply dark theme
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Reload page
    await page.reload();
    
    // Theme should be preserved
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should persist all settings together', async ({ page }) => {
    // Change multiple settings
    await page.getByLabel(/count/i).fill('10');
    await page.getByLabel(/include braces/i).check();
    await page.getByLabel(/uppercase/i).check();
    
    const themeToggle = page.getByTestId('theme-toggle');
    await themeToggle.click();
    
    // Reload page
    await page.reload();
    
    // All settings should be preserved
    await expect(page.getByLabel(/count/i)).toHaveValue('10');
    await expect(page.getByLabel(/include braces/i)).toBeChecked();
    await expect(page.getByLabel(/uppercase/i)).toBeChecked();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should handle localStorage unavailable gracefully', async ({ page, context }) => {
    // Mock localStorage as unavailable
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() { throw new Error('LocalStorage unavailable'); }
      });
    });
    
    await page.goto('/');
    
    // Should still work with defaults
    await expect(page.getByLabel(/count/i)).toHaveValue('1');
    
    // Should show warning about storage unavailable
    await expect(page.getByText(/storage unavailable|preferences not saved/i)).toBeVisible();
  });

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    // Set corrupted data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('uuid-generator-preferences', 'invalid-json');
    });
    
    await page.reload();
    
    // Should fallback to defaults
    await expect(page.getByLabel(/count/i)).toHaveValue('1');
    await expect(page.getByLabel(/include hyphens/i)).toBeChecked();
  });

  test('should migrate old storage format', async ({ page }) => {
    // Set old format data
    await page.evaluate(() => {
      // Old format without version info
      const oldData = {
        count: 7,
        theme: 'dark',
        includeHyphens: false
      };
      localStorage.setItem('uuid-generator-preferences', JSON.stringify(oldData));
    });
    
    await page.reload();
    
    // Should migrate and preserve settings
    await expect(page.getByLabel(/count/i)).toHaveValue('7');
    await expect(page.getByLabel(/include hyphens/i)).not.toBeChecked();
    
    // Should add version info
    const storedData = await page.evaluate(() => {
      const stored = localStorage.getItem('uuid-generator-preferences');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(storedData.version).toBeDefined();
  });

  test('should save preferences immediately when changed', async ({ page }) => {
    // Change a setting
    await page.getByLabel(/count/i).fill('15');
    
    // Check that it's saved immediately (not just on page unload)
    const storedData = await page.evaluate(() => {
      const stored = localStorage.getItem('uuid-generator-preferences');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(storedData.config.count).toBe(15);
    expect(storedData.version).toBeDefined();
    expect(storedData.lastUsed).toBeDefined();
  });

  test('should only save non-default preferences', async ({ page }) => {
    // Change only some settings
    await page.getByLabel(/count/i).fill('3');
    await page.getByLabel(/uppercase/i).check();
    // Leave other settings as default
    
    const storedData = await page.evaluate(() => {
      const stored = localStorage.getItem('uuid-generator-preferences');
      return stored ? JSON.parse(stored) : null;
    });
    
    // Should only store changed values
    expect(storedData.config.count).toBe(3);
    expect(storedData.config.upperCase).toBe(true);
    
    // Should not store default values
    expect(storedData.config.version).toBeUndefined(); // v4 is default
    expect(storedData.config.includeHyphens).toBeUndefined(); // true is default
    expect(storedData.config.includeBraces).toBeUndefined(); // false is default
  });

  test('should update lastUsed timestamp', async ({ page }) => {
    // Change a setting
    await page.getByLabel(/count/i).fill('2');
    
    const initialData = await page.evaluate(() => {
      const stored = localStorage.getItem('uuid-generator-preferences');
      return stored ? JSON.parse(stored) : null;
    });
    
    const initialTime = new Date(initialData.lastUsed).getTime();
    
    // Wait and change another setting
    await page.waitForTimeout(1000);
    await page.getByLabel(/uppercase/i).check();
    
    const updatedData = await page.evaluate(() => {
      const stored = localStorage.getItem('uuid-generator-preferences');
      return stored ? JSON.parse(stored) : null;
    });
    
    const updatedTime = new Date(updatedData.lastUsed).getTime();
    
    // lastUsed should be updated
    expect(updatedTime).toBeGreaterThan(initialTime);
  });

  test('should clear preferences when reset button clicked', async ({ page }) => {
    // Change settings
    await page.getByLabel(/count/i).fill('20');
    await page.getByLabel(/uppercase/i).check();
    
    // Find and click reset button
    const resetButton = page.getByTestId('reset-preferences');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Confirm reset if confirmation dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|reset/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Should restore defaults
      await expect(page.getByLabel(/count/i)).toHaveValue('1');
      await expect(page.getByLabel(/uppercase/i)).not.toBeChecked();
      
      // localStorage should be cleared
      const storedData = await page.evaluate(() => {
        return localStorage.getItem('uuid-generator-preferences');
      });
      
      expect(storedData).toBeNull();
    }
  });

  test('should handle storage quota exceeded', async ({ page, context }) => {
    // Mock localStorage to throw quota exceeded error
    await context.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key === 'uuid-generator-preferences') {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        return originalSetItem.call(this, key, value);
      };
    });
    
    await page.goto('/');
    
    // Change a setting
    await page.getByLabel(/count/i).fill('25');
    
    // Should show storage error message
    await expect(page.getByText(/storage full|quota exceeded|preferences not saved/i)).toBeVisible();
  });

  test('should work across multiple browser tabs', async ({ context }) => {
    // Create two pages/tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    // Change settings in first tab
    await page1.getByLabel(/count/i).fill('8');
    await page1.getByLabel(/uppercase/i).check();
    
    // Reload second tab
    await page2.reload();
    
    // Settings should be synced
    await expect(page2.getByLabel(/count/i)).toHaveValue('8');
    await expect(page2.getByLabel(/uppercase/i)).toBeChecked();
    
    await page1.close();
    await page2.close();
  });
});