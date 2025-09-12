/**
 * Clipboard Utilities
 * 
 * Implements the ClipboardAPI contract for copy operations.
 */

import { ClipboardAPI } from '@/types/contracts';
import { clipboardLogger } from './logger';

class ClipboardUtils implements ClipboardAPI {
  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    // Handle invalid inputs
    if (text == null) {
      return false;
    }

    const textStr = String(text);

    // Try modern clipboard API first - but only if user has interacted
    if (this.isClipboardAvailable()) {
      try {
        await navigator.clipboard.writeText(textStr);
        return true;
      } catch (error) {
        // If clipboard API fails, try fallback immediately
        clipboardLogger.warn('Clipboard API failed, trying fallback', error);
      }
    }

    // Try fallback method
    return this.fallbackCopy(textStr);
  }

  /**
   * Check if clipboard API is available
   */
  isClipboardAvailable(): boolean {
    try {
      return (
        typeof navigator !== 'undefined' &&
        typeof navigator.clipboard !== 'undefined' &&
        typeof navigator.clipboard.writeText === 'function' &&
        (window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost')
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if clipboard functionality is supported
   * Alias for isClipboardAvailable for compatibility
   */
  isSupported(): boolean {
    return this.isClipboardAvailable();
  }

  /**
   * Get fallback copy method (text selection)
   */
  fallbackCopy = (text: string): boolean => {
    // Note: document.queryCommandSupported is deprecated, so we just try the operation

    try {
      // Create temporary text area
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but accessible to screen readers
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('tabindex', '-1');
      textArea.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.focus();
      textArea.select();
      
      // For mobile devices, try different selection methods
      if (textArea.setSelectionRange) {
        textArea.setSelectionRange(0, text.length);
      } else if (textArea.select) {
        textArea.select();
      }
      
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      return successful;
    } catch (error) {
      clipboardLogger.warn('Fallback copy failed', error);
      return false;
    }
  };
}

/**
 * Factory function to create clipboard utils instance
 */
export function createClipboardUtils(): ClipboardAPI {
  return new ClipboardUtils();
}