/**
 * Integration Test: Accessibility Compliance
 * 
 * Tests WCAG 2.1 AA accessibility compliance.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper document structure', async ({ page }) => {
    // Should have single h1
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    
    // Should have proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.charAt(1));
      
      // Heading level should not skip more than one level
      expect(level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = level;
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // All form controls should have labels
    const formControls = page.locator('input, select, textarea');
    const controlCount = await formControls.count();
    
    for (let i = 0; i < controlCount; i++) {
      const control = formControls.nth(i);
      const id = await control.getAttribute('id');
      const ariaLabel = await control.getAttribute('aria-label');
      const ariaLabelledby = await control.getAttribute('aria-labelledby');
      
      if (id) {
        // Should have associated label
        const label = page.locator(`label[for=\"${id}\"]`);
        const hasLabel = await label.count() > 0;
        
        // Must have label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel || ariaLabelledby).toBe(true);
      } else {
        // Must have aria-label or aria-labelledby if no id
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Test main text elements
    const textElements = [
      page.getByRole('heading').first(),
      page.getByText(/count/i).first(),
      page.getByTestId('uuid-results')
    ];
    
    for (const element of textElements) {
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });
        
        // Parse RGB values
        const textColor = styles.color.match(/\\d+/g)?.map(Number) || [0, 0, 0];
        const bgColor = styles.backgroundColor.match(/\\d+/g)?.map(Number) || [255, 255, 255];
        
        // Calculate contrast ratio (simplified)
        const textLuminance = (0.299 * textColor[0] + 0.587 * textColor[1] + 0.114 * textColor[2]) / 255;
        const bgLuminance = (0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2]) / 255;
        
        const contrast = Math.abs(textLuminance - bgLuminance);
        
        // WCAG AA requires 4.5:1 contrast for normal text (simplified check)
        expect(contrast).toBeGreaterThan(0.3);
      }
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Buttons should have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      const title = await button.getAttribute('title');
      
      // Button must have accessible name
      expect(ariaLabel || textContent?.trim() || title).toBeTruthy();
    }
    
    // Interactive elements should have roles
    const interactiveElements = page.locator('[data-testid*=\"button\"], [data-testid*=\"toggle\"]');
    const interactiveCount = await interactiveElements.count();
    
    for (let i = 0; i < interactiveCount; i++) {
      const element = interactiveElements.nth(i);
      const role = await element.getAttribute('role');
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      // Should have proper role or be semantic element
      const hasProperRole = role === 'button' || tagName === 'button' || tagName === 'input';
      expect(hasProperRole).toBe(true);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Should be able to reach all interactive elements via keyboard
    const interactiveElements = await page.locator('button, input, [tabindex=\"0\"]').all();
    
    for (const element of interactiveElements) {
      await element.focus();
      await expect(element).toBeFocused();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    // Focus should be visible
    const countInput = page.getByLabel(/count/i);
    await countInput.focus();
    
    // Should have focus indicator
    const focusStyles = await countInput.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow
      };
    });
    
    // Should have some focus indicator
    expect(focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none').toBe(true);
  });

  test('should have proper semantic structure', async ({ page }) => {
    // Should use semantic HTML elements
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
    
    // Should have proper landmarks
    const landmarks = await page.locator('[role=\"main\"], main, [role=\"navigation\"], nav, header, footer').count();
    expect(landmarks).toBeGreaterThan(0);
  });

  test('should provide text alternatives for non-text content', async ({ page }) => {
    // All images should have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Should have alt text unless it's decorative
      if (role !== 'presentation' && alt !== '') {
        expect(alt || ariaLabel).toBeTruthy();
      }
    }
    
    // Icons should have accessible names or be hidden
    const icons = page.locator('[data-testid*=\"icon\"]');
    const iconCount = await icons.count();
    
    for (let i = 0; i < iconCount; i++) {
      const icon = icons.nth(i);
      const ariaLabel = await icon.getAttribute('aria-label');
      const ariaHidden = await icon.getAttribute('aria-hidden');
      const title = await icon.getAttribute('title');
      
      // Should be hidden or have accessible name
      expect(ariaHidden === 'true' || ariaLabel || title).toBeTruthy();
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for live regions
    const liveRegions = page.locator('[aria-live], [role=\"status\"], [role=\"alert\"]');
    
    if (await liveRegions.count() > 0) {
      // Should announce changes
      const countInput = page.getByLabel(/count/i);
      await countInput.fill('5');
      
      // Live region should be updated
      const liveRegion = liveRegions.first();
      const announcement = await liveRegion.textContent();
      
      expect(announcement).toBeTruthy();
    }
  });

  test('should support assistive technology', async ({ page }) => {
    // Test with simulated screen reader behavior
    const countInput = page.getByLabel(/count/i);
    
    // Should be able to read label
    const label = await page.locator('label[for]').first().textContent();
    expect(label).toBeTruthy();
    
    // Should be able to read current value
    const value = await countInput.inputValue();
    expect(value).toBeTruthy();
    
    // Should announce changes
    await countInput.fill('3');
    
    // Should have proper input type
    const type = await countInput.getAttribute('type');
    expect(type).toBe('number');
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: white !important;
            color: black !important;
            border-color: black !important;
          }
        }
      `
    });
    
    // Elements should still be visible and functional
    const copyButton = page.getByTestId('copy-all-button');
    await expect(copyButton).toBeVisible();
    
    // Should still be clickable
    await copyButton.click();
    await expect(page.getByText(/copied/i)).toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page, context }) => {
    // Mock reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
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
    
    // Animations should be disabled or reduced
    const themeToggle = page.getByTestId('theme-toggle');
    await themeToggle.click();
    
    // Should still function without animations
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should have proper error messages', async ({ page }) => {
    const countInput = page.getByLabel(/count/i);
    
    // Enter invalid value
    await countInput.fill('0');
    
    // Error should be associated with input
    const errorMessage = page.getByText(/count must be/i);
    if (await errorMessage.isVisible()) {
      const errorId = await errorMessage.getAttribute('id');
      const ariaDescribedby = await countInput.getAttribute('aria-describedby');
      
      // Error should be connected to input
      expect(ariaDescribedby).toContain(errorId);
    }
  });

  test('should support zoom up to 200%', async ({ page }) => {
    // Simulate 200% zoom
    await page.setViewportSize({ width: 640, height: 480 }); // Half size to simulate 200% zoom
    
    // All content should still be accessible
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByLabel(/count/i)).toBeVisible();
    await expect(page.getByTestId('copy-all-button')).toBeVisible();
    
    // Should still be functional
    const countInput = page.getByLabel(/count/i);
    await countInput.fill('2');
    
    const uuidResults = page.getByTestId('uuid-results');
    const resultsText = await uuidResults.textContent();
    const uuidCount = (resultsText?.match(/[0-9a-f-]{36}/g) || []).length;
    expect(uuidCount).toBe(2);
  });

  test('should have proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toMatch(/uuid|generator/i);
  });

  test('should use proper HTML lang attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., \"en\" or \"en-US\"
  });

  test('should support custom focus order with tabindex', async ({ page }) => {
    // Check that tabindex is used appropriately
    const elementsWithTabindex = page.locator('[tabindex]');
    const count = await elementsWithTabindex.count();
    
    for (let i = 0; i < count; i++) {
      const element = elementsWithTabindex.nth(i);
      const tabindex = await element.getAttribute('tabindex');
      
      // Tabindex should be -1, 0, or not used (never positive unless justified)
      const tabindexValue = parseInt(tabindex || '0');
      expect(tabindexValue).toBeLessThanOrEqual(0);
    }
  });
});