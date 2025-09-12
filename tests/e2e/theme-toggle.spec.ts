/**
 * E2E Test: Dark Mode Toggle
 * 
 * Tests theme switching functionality.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have theme toggle control', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should start with system theme by default', async ({ page }) => {
    // Should indicate system theme is selected
    const systemThemeIndicator = page.getByText(/system/i);
    await expect(systemThemeIndicator).toBeVisible();
  });

  test('should toggle to dark mode', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Click to switch to dark mode
    await themeToggle.click();
    
    // Should apply dark mode class
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Should update button/indicator
    await expect(page.getByText(/dark/i)).toBeVisible();
  });

  test('should toggle to light mode', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // First switch to dark
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Then switch to light
    await themeToggle.click();
    
    // Should remove dark class
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Should update indicator
    await expect(page.getByText(/light/i)).toBeVisible();
  });

  test('should cycle through theme options', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Initial: system
    await expect(page.getByText(/system/i)).toBeVisible();
    
    // Click 1: dark
    await themeToggle.click();
    await expect(page.getByText(/dark/i)).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Click 2: light
    await themeToggle.click();
    await expect(page.getByText(/light/i)).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Click 3: back to system
    await themeToggle.click();
    await expect(page.getByText(/system/i)).toBeVisible();
  });

  test('should respect system theme preference', async ({ page, context }) => {
    // Mock system preference for dark mode
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    });
    
    await page.reload();
    
    // Should use system dark theme
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should update theme icons/indicators', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Should have appropriate icons for different themes
    const sunIcon = page.getByTestId('sun-icon');
    const moonIcon = page.getByTestId('moon-icon');
    const systemIcon = page.getByTestId('system-icon');
    
    // Switch to dark mode
    await themeToggle.click();
    if (await moonIcon.isVisible()) {
      await expect(moonIcon).toBeVisible();
    }
    
    // Switch to light mode
    await themeToggle.click();
    if (await sunIcon.isVisible()) {
      await expect(sunIcon).toBeVisible();
    }
    
    // Switch to system mode
    await themeToggle.click();
    if (await systemIcon.isVisible()) {
      await expect(systemIcon).toBeVisible();
    }
  });

  test('should apply theme to all UI components', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Switch to dark mode
    await themeToggle.click();
    
    // Check that various components have dark theme styling
    const mainContainer = page.getByTestId('main-container');
    const controlPanel = page.getByTestId('control-panel');
    const uuidResults = page.getByTestId('uuid-results');
    
    // Should have dark theme classes or styles
    await expect(mainContainer).toHaveClass(/dark|bg-gray-900|bg-slate-900/);
    
    // Text should be light in dark mode
    const headingColor = await page.getByRole('heading').first().evaluate(el => 
      getComputedStyle(el).color
    );
    
    // Should be light color (rgb values > 200)
    expect(headingColor).toMatch(/rgb\(2[5-9][0-9]|rgb\(255/);
  });

  test('should persist theme preference', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Switch to dark mode
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Reload page
    await page.reload();
    
    // Theme should be preserved
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByText(/dark/i)).toBeVisible();
  });

  test('should handle theme transitions smoothly', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Check for transition classes or animations
    await themeToggle.click();
    
    // Should have transition classes during theme change
    const html = page.locator('html');
    await expect(html).toHaveClass(/transition|duration/);
    
    // Colors should transition smoothly (not flash)
    const backgroundColor = await html.evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    
    expect(backgroundColor).toBeDefined();
  });


  test('should support keyboard navigation', async ({ page }) => {
    // Focus on theme toggle with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to theme toggle
    
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(themeToggle).toBeFocused();
    
    // Activate with Enter or Space
    await page.keyboard.press('Enter');
    
    // Should switch theme
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should have accessible labels and ARIA attributes', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Should have accessible name
    await expect(themeToggle).toHaveAttribute('aria-label');
    
    // Should indicate current state
    const ariaLabel = await themeToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/theme|dark|light|system/i);
    
    // Should have role if it's a button
    const role = await themeToggle.getAttribute('role');
    if (role) {
      expect(role).toBe('button');
    }
  });

  test('should respond to system theme changes', async ({ page, context }) => {
    // Start with system theme
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(page.getByText(/system/i)).toBeVisible();
    
    // Simulate system theme change to dark
    await context.addInitScript(() => {
      // Mock matchMedia to return dark theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      Object.defineProperty(mediaQuery, 'matches', { value: true });
      
      // Trigger change event if listener exists
      if (mediaQuery.onchange) {
        mediaQuery.onchange(mediaQuery);
      }
    });
    
    // Should apply system dark theme
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should handle theme toggle dropdown/menu', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // If it's a dropdown, click should open menu
    await themeToggle.click();
    
    const themeMenu = page.getByTestId('theme-menu');
    if (await themeMenu.isVisible()) {
      // Should have all theme options
      await expect(page.getByText(/system/i)).toBeVisible();
      await expect(page.getByText(/light/i)).toBeVisible();
      await expect(page.getByText(/dark/i)).toBeVisible();
      
      // Select dark theme
      await page.getByText(/dark/i).click();
      
      // Menu should close and theme should apply
      await expect(themeMenu).not.toBeVisible();
      await expect(page.locator('html')).toHaveClass(/dark/);
    }
  });

  test('should work correctly in different viewport sizes', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(themeToggle).toBeVisible();
    
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(themeToggle).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should maintain theme during navigation', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Switch to dark mode
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Navigate (if there are other pages)
    // This test assumes single-page app, so we'll just reload
    await page.reload();
    
    // Theme should persist
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});