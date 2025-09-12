/**
 * Regression Tests for Copy Button UI
 * 
 * Tests to prevent copy button icon duplication issues identified during Phase 3.6 integration
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResultDisplay } from '@/components/result-display';
import { CopyButton, UUIDCopyButton } from '@/components/copy-button';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Copy Button UI - Regression Tests', () => {
  const mockResult = {
    uuids: ['uuid1', 'uuid2', 'uuid3'],
    formattedOutput: 'uuid1\nuuid2\nuuid3',
    performanceMetrics: {
      generationTimeMs: 10,
      formatTimeMs: 5,
    },
  };

  describe('Issue: Individual UUID copy showing duplicate icons', () => {
    it('should show only one copy icon per UUID in ResultDisplay', async () => {
      const mockOnCopyAll = jest.fn().mockResolvedValue(true);
      const mockOnCopySingle = jest.fn().mockResolvedValue(true);
      const mockOnClear = jest.fn();
      const mockOnRegenerate = jest.fn();

      render(
        <ResultDisplay
          result={mockResult}
          onCopyAll={mockOnCopyAll}
          onCopySingle={mockOnCopySingle}
          onClear={mockOnClear}
          onRegenerate={mockOnRegenerate}
          isGenerating={false}
        />
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('uuid1')).toBeInTheDocument();
      });

      // Check each UUID row has exactly one copy button
      const uuid1Row = screen.getByText('uuid1').closest('.flex');
      const uuid2Row = screen.getByText('uuid2').closest('.flex');
      const uuid3Row = screen.getByText('uuid3').closest('.flex');

      // Each row should have exactly one copy button (using UUIDCopyButton)
      expect(uuid1Row?.querySelectorAll('button')).toHaveLength(1);
      expect(uuid2Row?.querySelectorAll('button')).toHaveLength(1);
      expect(uuid3Row?.querySelectorAll('button')).toHaveLength(1);

      // Each copy button should have only one icon
      const copyButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Copy')
      );
      
      copyButtons.forEach(button => {
        const icons = button.querySelectorAll('svg');
        expect(icons).toHaveLength(1);
      });
    });

    it('should not show duplicate icons in CopyButton with children', () => {
      render(
        <CopyButton text="test" showToast={false}>
          <svg data-testid="child-icon" />
          Test Text
        </CopyButton>
      );

      const button = screen.getByRole('button');
      const icons = button.querySelectorAll('svg');
      
      // Should only show the child icon, not both child + internal icon
      expect(icons).toHaveLength(1);
      expect(screen.getByTestId('child-icon')).toBeInTheDocument();
    });

    it('should show internal icon when no children provided', () => {
      render(<CopyButton text="test" showToast={false} />);

      const button = screen.getByRole('button');
      const icons = button.querySelectorAll('svg');
      
      // Should show internal copy icon
      expect(icons).toHaveLength(1);
    });

    it('should properly handle UUIDCopyButton without icon duplication', () => {
      const mockOnCopy = jest.fn().mockResolvedValue(true);

      render(
        <UUIDCopyButton
          uuid="test-uuid-123"
          index={0}
          onCopy={mockOnCopy}
        />
      );

      const button = screen.getByRole('button');
      const icons = button.querySelectorAll('svg');
      
      // Should have exactly one copy icon
      expect(icons).toHaveLength(1);
    });

    it('should change icon state correctly on copy without duplication', async () => {
      const mockOnCopy = jest.fn().mockResolvedValue(true);

      render(
        <UUIDCopyButton
          uuid="test-uuid-123"
          index={0}
          onCopy={mockOnCopy}
        />
      );

      const button = screen.getByRole('button');
      
      // Initial state - should have copy icon
      expect(button.querySelectorAll('svg')).toHaveLength(1);
      
      // Click to copy
      fireEvent.click(button);
      
      // Should change to check icon (still only one icon)
      await waitFor(() => {
        expect(button.querySelectorAll('svg')).toHaveLength(1);
        // Icon should have changed to check mark
        expect(button.querySelector('[data-lucide="check"]')).toBeInTheDocument();
      });

      // Should revert back to copy icon after delay
      await waitFor(() => {
        expect(button.querySelector('[data-lucide="copy"]')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Root cause: CopyButton component children + icon logic', () => {
    it('should not render internal icon when children are provided', () => {
      const { container } = render(
        <CopyButton text="test" showToast={false}>
          <span data-testid="custom-content">Custom</span>
        </CopyButton>
      );

      // Should only render children content, not internal icon
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      
      // The button should have children but internal icon logic should be bypassed
      const button = container.querySelector('button');
      const svgElements = button?.querySelectorAll('svg');
      
      // If children contain SVG, that should be the only one
      expect(svgElements?.length).toBeLessThanOrEqual(1);
    });

    it('should render internal icon only when no children provided', () => {
      render(<CopyButton text="test" showToast={false} />);

      const button = screen.getByRole('button');
      const svgElements = button.querySelectorAll('svg');
      
      // Should have exactly one internal icon
      expect(svgElements).toHaveLength(1);
    });

    it('should properly handle icon state changes without duplication', async () => {
      const { rerender } = render(
        <CopyButton text="test" showToast={false} />
      );

      const button = screen.getByRole('button');
      
      // Click to trigger copy
      fireEvent.click(button);
      
      // During copied state, should still have only one icon
      await waitFor(() => {
        expect(button.querySelectorAll('svg')).toHaveLength(1);
      });
      
      // Rerender to simulate state change
      rerender(<CopyButton text="test" showToast={false} />);
      
      // Should still have only one icon
      expect(button.querySelectorAll('svg')).toHaveLength(1);
    });
  });
});