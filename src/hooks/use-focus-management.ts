/**
 * Focus Management Hook
 * 
 * Provides utilities for managing focus state, focus trapping, and visual focus indicators.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  skipLinks?: boolean;
}

export interface FocusState {
  hasFocus: boolean;
  isKeyboardUser: boolean;
  focusedElementId?: string;
}

export function useFocusManagement(options: FocusManagementOptions = {}) {
  const {
    trapFocus = false,
    restoreFocus = true,
    skipLinks = true
  } = options;

  const [focusState, setFocusState] = useState<FocusState>({
    hasFocus: false,
    isKeyboardUser: false
  });

  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isMouseUserRef = useRef(false);

  // Detect if user is using keyboard for navigation
  useEffect(() => {
    const handleMouseDown = () => {
      isMouseUserRef.current = true;
      setFocusState(prev => ({ ...prev, isKeyboardUser: false }));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab key indicates keyboard navigation
      if (event.key === 'Tab') {
        isMouseUserRef.current = false;
        setFocusState(prev => ({ ...prev, isKeyboardUser: true }));
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Track focus state within container
  const handleFocusIn = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const container = containerRef.current;
    
    if (container && container.contains(target)) {
      setFocusState(prev => ({
        ...prev,
        hasFocus: true,
        focusedElementId: target.id || undefined
      }));
    }
  }, []);

  const handleFocusOut = useCallback((event: FocusEvent) => {
    const target = event.relatedTarget as HTMLElement;
    const container = containerRef.current;
    
    if (container && (!target || !container.contains(target))) {
      setFocusState(prev => ({
        ...prev,
        hasFocus: false,
        focusedElementId: undefined
      }));
    }
  }, []);

  // Set up focus event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [handleFocusIn, handleFocusOut]);

  // Focus trap implementation
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (forward)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap is activated
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore previous focus when trap is deactivated
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [trapFocus, restoreFocus]);

  // Skip links implementation
  useEffect(() => {
    if (!skipLinks) return;

    const createSkipLink = (targetId: string, text: string) => {
      const skipLink = document.createElement('a');
      skipLink.href = `#${targetId}`;
      skipLink.textContent = text;
      skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded';
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      return skipLink;
    };

    // Add skip links to document head
    const skipToMain = createSkipLink('main-content', 'Skip to main content');
    const skipToSettings = createSkipLink('settings-title', 'Skip to settings');
    
    document.body.insertBefore(skipToMain, document.body.firstChild);
    document.body.insertBefore(skipToSettings, document.body.firstChild);

    return () => {
      skipToMain.remove();
      skipToSettings.remove();
    };
  }, [skipLinks]);


  const focusElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const focusFirstInContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    firstFocusable?.focus();
  }, []);

  const focusLastInContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    lastFocusable?.focus();
  }, []);

  const clearFocus = useCallback(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
  }, []);

  return {
    // State
    focusState,
    containerRef,

    // Actions
    focusElement,
    focusFirstInContainer,
    focusLastInContainer,
    clearFocus,

    // Utilities
    isKeyboardUser: focusState.isKeyboardUser,
    hasFocus: focusState.hasFocus,
    focusedElementId: focusState.focusedElementId
  };
}

/**
 * Focus management utilities for global use
 */
export const FocusUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  },

  /**
   * Check if element is focusable
   */
  isFocusable: (element: HTMLElement): boolean => {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return element.matches(selector) && !element.hasAttribute('disabled');
  },

  /**
   * Get next focusable element in tab order
   */
  getNextFocusable: (currentElement: HTMLElement, container?: HTMLElement): HTMLElement | null => {
    const root = container || document.body;
    const focusables = FocusUtils.getFocusableElements(root);
    const currentIndex = focusables.indexOf(currentElement);
    
    return currentIndex >= 0 && currentIndex < focusables.length - 1
      ? focusables[currentIndex + 1]
      : null;
  },

  /**
   * Get previous focusable element in tab order
   */
  getPreviousFocusable: (currentElement: HTMLElement, container?: HTMLElement): HTMLElement | null => {
    const root = container || document.body;
    const focusables = FocusUtils.getFocusableElements(root);
    const currentIndex = focusables.indexOf(currentElement);
    
    return currentIndex > 0
      ? focusables[currentIndex - 1]
      : null;
  },

  /**
   * Create visible focus indicator styles
   */
  createFocusStyles: () => ({
    outline: '2px solid hsl(var(--ring))',
    outlineOffset: '2px',
    borderRadius: '4px'
  }),

  /**
   * Announce focus change to screen readers
   */
  announceFocusChange: (elementDescription: string) => {
    const announcement = `Focused on ${elementDescription}`;
    
    // Create temporary live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = announcement;
    
    document.body.appendChild(liveRegion);
    
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }
};