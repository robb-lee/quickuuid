/**
 * useClipboard Hook
 * 
 * Custom React hook for clipboard operations with error handling.
 */

import { useState, useCallback, useMemo } from 'react';
import { createClipboardUtils } from '@/lib/clipboard-utils';

interface CopyState {
  value: string;
  success: boolean;
  error: string | null;
}

export function useClipboard(): {
  copy: (text: string) => Promise<boolean>;
  copyState: CopyState;
  isSupported: boolean;
  reset: () => void;
} {
  const clipboardUtils = useMemo(() => createClipboardUtils(), []);
  
  const [copyState, setCopyState] = useState<CopyState>({
    value: '',
    success: false,
    error: null
  });

  // Check if clipboard API is supported
  const isSupported = useMemo(() => {
    return clipboardUtils.isSupported();
  }, [clipboardUtils]);

  // Copy function
  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) {
      setCopyState({
        value: '',
        success: false,
        error: 'No text provided'
      });
      return false;
    }

    try {
      const success = await clipboardUtils.copyToClipboard(text);
      
      setCopyState({
        value: text,
        success,
        error: success ? null : 'Failed to copy to clipboard'
      });

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setCopyState({
        value: text,
        success: false,
        error: errorMessage
      });

      return false;
    }
  }, [clipboardUtils]);

  // Reset function
  const reset = useCallback(() => {
    setCopyState({
      value: '',
      success: false,
      error: null
    });
  }, []);

  return {
    copy,
    copyState,
    isSupported,
    reset
  };
}