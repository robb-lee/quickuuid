/**
 * Keyboard Navigation Hook
 * 
 * Provides keyboard navigation utilities for accessibility.
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onSpace,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      case 'Enter':
        if (onEnter) {
          // Only prevent default if we're not in an input/textarea
          const target = event.target as HTMLElement;
          if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
            event.preventDefault();
            onEnter();
          }
        }
        break;

      case ' ':
        if (onSpace) {
          // Only prevent default if we're not in an input/textarea
          const target = event.target as HTMLElement;
          if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
            event.preventDefault();
            onSpace();
          }
        }
        break;

      case 'Tab':
        if (onTab) {
          onTab(event);
        }
        break;

      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp();
        }
        break;

      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown();
        }
        break;

      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft();
        }
        break;

      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight();
        }
        break;

      default:
        break;
    }
  }, [
    enabled,
    onEscape,
    onEnter,
    onSpace,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight
  ]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return {
    // Helper function to make elements keyboard focusable
    makeFocusable: (props: React.HTMLAttributes<HTMLElement> = {}) => ({
      ...props,
      tabIndex: props.tabIndex ?? 0,
      role: props.role ?? 'button',
    }),

    // Helper function to handle click and keyboard events
    handleActivation: (callback: () => void) => ({
      onClick: callback,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          callback();
        }
      }
    })
  };
}

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Focus the first focusable element in a container
   */
  focusFirst: (container: HTMLElement | null) => {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  },

  /**
   * Focus the last focusable element in a container
   */
  focusLast: (container: HTMLElement | null) => {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  },

  /**
   * Trap focus within a container (for modals, etc.)
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  },

  /**
   * Get next/previous focusable element
   */
  getNextFocusable: (current: HTMLElement, direction: 'next' | 'prev' = 'next') => {
    const focusableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(current);
    if (currentIndex === -1) return null;

    if (direction === 'next') {
      return focusableElements[currentIndex + 1] || focusableElements[0];
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
    }
  }
};