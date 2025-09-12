/**
 * Screen Reader Hook
 * 
 * Provides utilities for announcing information to screen readers.
 */

import { useCallback, useRef } from 'react';

export interface ScreenReaderAnnouncementOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
  clear?: boolean;
}

export function useScreenReader() {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Ensure the announcement container exists
  const ensureAnnouncementContainer = useCallback(() => {
    if (!announcementRef.current) {
      // Check if container already exists
      let container = document.getElementById('screen-reader-announcements');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'screen-reader-announcements';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        container.className = 'sr-only';
        container.style.cssText = `
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        `;
        document.body.appendChild(container);
      }
      
      announcementRef.current = container as HTMLDivElement;
    }
    
    return announcementRef.current;
  }, []);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((
    message: string, 
    options: ScreenReaderAnnouncementOptions = {}
  ) => {
    const { priority = 'polite', delay = 100, clear = false } = options;
    
    const container = ensureAnnouncementContainer();
    
    if (clear) {
      container.textContent = '';
    }
    
    // Set the appropriate aria-live level
    container.setAttribute('aria-live', priority);
    
    // Delay the announcement slightly to ensure it's picked up by screen readers
    setTimeout(() => {
      if (clear) {
        container.textContent = message;
      } else {
        // Append with a separator for multiple announcements
        const separator = container.textContent ? '. ' : '';
        container.textContent += separator + message;
      }
      
      // Clear the announcement after a reasonable time to prevent accumulation
      setTimeout(() => {
        if (container.textContent === message || 
            (container.textContent && container.textContent.includes(message))) {
          container.textContent = '';
        }
      }, 5000);
    }, delay);
  }, [ensureAnnouncementContainer]);

  /**
   * Announce success messages
   */
  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, { priority: 'polite', clear: true });
  }, [announce]);

  /**
   * Announce error messages
   */
  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, { priority: 'assertive', clear: true });
  }, [announce]);

  /**
   * Announce status changes
   */
  const announceStatus = useCallback((message: string) => {
    announce(message, { priority: 'polite', clear: true });
  }, [announce]);

  /**
   * Announce when copying is successful
   */
  const announceCopySuccess = useCallback((itemType: string, count?: number) => {
    const message = count && count > 1 
      ? `${count} ${itemType}s copied to clipboard`
      : `${itemType} copied to clipboard`;
    announceSuccess(message);
  }, [announceSuccess]);

  /**
   * Announce when UUID generation is complete
   */
  const announceGeneration = useCallback((count: number, time?: number) => {
    const timeText = time ? ` in ${time.toFixed(1)} milliseconds` : '';
    const message = `${count} UUID${count !== 1 ? 's' : ''} generated${timeText}`;
    announceStatus(message);
  }, [announceStatus]);

  /**
   * Announce configuration changes
   */
  const announceConfigChange = useCallback((setting: string, value: string | boolean | number) => {
    let message = '';
    
    if (typeof value === 'boolean') {
      message = `${setting} ${value ? 'enabled' : 'disabled'}`;
    } else {
      message = `${setting} changed to ${value}`;
    }
    
    announce(message, { priority: 'polite' });
  }, [announce]);

  /**
   * Announce performance warnings
   */
  const announcePerformanceWarning = useCallback((message: string, type: 'warning' | 'critical') => {
    const priority = type === 'critical' ? 'assertive' : 'polite';
    announce(`Performance ${type}: ${message}`, { priority });
  }, [announce]);

  return {
    announce,
    announceSuccess,
    announceError,
    announceStatus,
    announceCopySuccess,
    announceGeneration,
    announceConfigChange,
    announcePerformanceWarning
  };
}

/**
 * Global screen reader utilities
 */
export const ScreenReaderUtils = {
  /**
   * Create a live region element
   */
  createLiveRegion: (priority: 'polite' | 'assertive' = 'polite') => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    return region;
  },

  /**
   * Check if screen reader is likely being used
   * Note: This is not 100% reliable, but can help optimize announcements
   */
  isLikelyUsingScreenReader: () => {
    // Check for common screen reader indicators
    return (
      // High contrast mode (often used with screen readers)
      window.matchMedia('(prefers-contrast: high)').matches ||
      // Reduced motion (often used with screen readers)
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // Check for screen reader specific user agents (not reliable)
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver')
    );
  },

  /**
   * Format time for screen reader announcement
   */
  formatTimeForScreenReader: (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(0)} milliseconds`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)} seconds`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} seconds`;
    }
  }
};