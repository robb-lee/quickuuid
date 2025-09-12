/**
 * useUUIDGenerator Hook
 * 
 * Custom React hook that integrates all UUID generation utilities
 * and provides real-time UUID generation with state management.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UUIDGeneratorConfig, defaultConfig } from '@/types';
import { createUUIDGenerator } from '@/lib/uuid-generator';
import { createFormatUtils } from '@/lib/format-utils';
import { createStorageUtils } from '@/lib/storage-utils';
import { createClipboardUtils } from '@/lib/clipboard-utils';
import { PerformanceUtils, PerformanceManager } from '@/lib/performance-utils';
import { ValidationUtils } from '@/lib/validation-utils';
import { useScreenReader } from '@/hooks/use-screen-reader';
import { useDebounce, useDebouncedCallback } from '@/hooks/use-debounce';

interface CopyResult {
  type: 'single' | 'bulk';
  success: boolean;
  content: string;
}

interface GenerationResult {
  uuids: string[];
  formattedOutput: string;
  performanceMetrics: {
    generationTimeMs: number;
    formatTimeMs: number;
  };
}

export interface UseUUIDGeneratorReturn {
  // State
  config: UUIDGeneratorConfig;
  result?: GenerationResult;
  isGenerating: boolean;
  error?: string;
  performanceHealth?: {
    status: 'good' | 'warning' | 'critical';
    message: string;
    hasActiveIssues: boolean;
  };

  // Actions
  updateConfig: (updates: Partial<UUIDGeneratorConfig>) => void;
  regenerate: () => Promise<void>;
  copyAll: () => Promise<CopyResult>;
  copySingle: (uuid: string) => Promise<CopyResult>;
}

export function useUUIDGenerator(initialConfig?: Partial<UUIDGeneratorConfig>): UseUUIDGeneratorReturn {
  // Core utilities
  const uuidGenerator = useMemo(() => createUUIDGenerator(), []);
  const formatUtils = useMemo(() => createFormatUtils(), []);
  const storageUtils = useMemo(() => createStorageUtils(), []);
  const clipboardUtils = useMemo(() => createClipboardUtils(), []);
  
  // Screen reader announcements
  const { 
    announceGeneration, 
    announceCopySuccess, 
    announceError, 
    announceConfigChange, 
    announcePerformanceWarning 
  } = useScreenReader();

  // State
  const [config, setConfig] = useState<UUIDGeneratorConfig>(() => ({ ...defaultConfig, ...initialConfig }));
  const [result, setResult] = useState<GenerationResult | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [performanceHealth, setPerformanceHealth] = useState<{
    status: 'good' | 'warning' | 'critical';
    message: string;
    hasActiveIssues: boolean;
  } | undefined>(undefined);
  
  // Timer ref for auto-dismissing performance warnings
  const performanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced config for performance-critical operations (count, version changes)
  const debouncedConfig = useDebounce(config, 300);
  
  // Ref to track if we should auto-regenerate
  const shouldAutoRegenerate = useRef(false);

  // Load saved preferences on mount (only if no initial config provided)
  useEffect(() => {
    if (!initialConfig) {
      const loadPreferences = async () => {
        try {
          const savedPreferences = await storageUtils.loadPreferences();
          if (Object.keys(savedPreferences).length > 0) {
            setConfig(current => ({ ...current, ...savedPreferences }));
          }
        } catch (err) {
          console.warn('Failed to load preferences:', err);
        }
      };

      loadPreferences();
    }
  }, [storageUtils, initialConfig]);

  // Debounced preference saving to avoid excessive localStorage writes
  const debouncedSavePreferences = useDebouncedCallback(
    async (configToSave: UUIDGeneratorConfig) => {
      try {
        await storageUtils.savePreferences(configToSave);
      } catch (err) {
        console.warn('Failed to save preferences:', err);
      }
    },
    500,
    [storageUtils]
  );

  // Save preferences when config changes
  useEffect(() => {
    debouncedSavePreferences(config);
  }, [config, debouncedSavePreferences]);

  // Internal regenerate function - not using useCallback to avoid dependency issues
  const regenerateInternal = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(undefined);

    try {
      // Generate UUIDs with performance monitoring
      const { result: uuids, duration: generationTimeMs } = await PerformanceManager.timeAsync(
        'uuidGeneration',
        async () => {
          try {
            return uuidGenerator.generateUUIDs(config);
          } catch (error) {
            // Fallback: generate single UUID if batch fails
            console.warn('Batch UUID generation failed, falling back to single UUID:', error);
            return [uuidGenerator.generateUUIDs({ ...config, count: 1 })[0]];
          }
        }
      );

      // Format UUIDs with performance monitoring
      const { result: formattedOutput, duration: formatTimeMs } = PerformanceManager.timeSync(
        'formatting',
        () => formatUtils.formatUUIDs(uuids, {
          includeHyphens: config.includeHyphens,
          includeBraces: config.includeBraces,
          includeQuotes: config.includeQuotes,
          upperCase: config.upperCase,
          separateWithCommas: config.separateWithCommas
        })
      );

      // Update state
      setResult({
        uuids,
        formattedOutput,
        performanceMetrics: {
          generationTimeMs,
          formatTimeMs
        }
      });

      // Update performance health status
      const healthStatus = PerformanceManager.getHealthStatus();
      setPerformanceHealth({
        status: healthStatus.status,
        message: healthStatus.message,
        hasActiveIssues: PerformanceManager.hasActiveIssues()
      });
      
      // Auto-dismiss performance warnings after 10 seconds
      if (healthStatus.status !== 'good') {
        // Clear any existing timer
        if (performanceTimerRef.current) {
          clearTimeout(performanceTimerRef.current);
        }
        
        // Set new timer for non-critical warnings only
        if (healthStatus.status === 'warning') {
          performanceTimerRef.current = setTimeout(() => {
            setPerformanceHealth(undefined);
            performanceTimerRef.current = null;
          }, 10000); // 10 seconds
        }
      }

      // Announce generation completion
      announceGeneration(uuids.length, generationTimeMs);

      // Announce performance warnings if needed
      if (healthStatus.status !== 'good') {
        announcePerformanceWarning(healthStatus.message, healthStatus.status === 'critical' ? 'critical' : 'warning');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate UUIDs';
      setError(errorMessage);
      announceError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Use ref to track if initial generation has happened
  const hasInitialGeneration = useRef(false);

  // Initial generation on mount (client-side only to prevent hydration mismatch)
  useEffect(() => {
    if (!hasInitialGeneration.current && typeof window !== 'undefined') {
      hasInitialGeneration.current = true;
      // Delay to ensure hydration is complete
      setTimeout(() => {
        regenerateInternal();
      }, 0);
    }
  }, []);

  // Auto-regenerate UUIDs when count or version changes (debounced for performance)
  useEffect(() => {
    if (hasInitialGeneration.current) {
      regenerateInternal();
    }
  }, [debouncedConfig.count, debouncedConfig.version]);

  // Auto-reformat when format options change (without regenerating UUIDs)
  useEffect(() => {
    if (hasInitialGeneration.current && result?.uuids) {
      // Only reformat existing UUIDs, don't regenerate them
      const { result: formattedOutput, duration: formatTimeMs } = PerformanceManager.timeSync(
        'formatting',
        () => formatUtils.formatUUIDs(result.uuids, {
          includeHyphens: config.includeHyphens,
          includeBraces: config.includeBraces,
          includeQuotes: config.includeQuotes,
          upperCase: config.upperCase,
          separateWithCommas: config.separateWithCommas
        })
      );

      setResult(prevResult => prevResult ? {
        ...prevResult,
        formattedOutput,
        performanceMetrics: {
          ...prevResult.performanceMetrics,
          formatTimeMs
        }
      } : undefined);
    }
  }, [config.includeHyphens, config.includeBraces, config.includeQuotes, config.upperCase, config.separateWithCommas, result?.uuids, formatUtils]);

  // Actions
  const regenerate = useCallback(async () => {
    await regenerateInternal();
  }, [config]);

  const updateConfig = useCallback((updates: Partial<UUIDGeneratorConfig>) => {
    // Validate input before applying updates
    const validationResult = ValidationUtils.validateConfig(updates);
    
    if (!validationResult.isValid) {
      // Set user-friendly error message for the first validation error
      const firstError = validationResult.errors[0];
      const userMessage = ValidationUtils.getValidationMessage(firstError.field, updates[firstError.field as keyof UUIDGeneratorConfig]);
      const errorMessage = userMessage || firstError.message;
      setError(errorMessage);
      announceError(errorMessage);
      return;
    }

    // Apply updates if validation passes
    setConfig(current => ({ ...current, ...updates }));
    setError(undefined);
    
    // Announce configuration changes
    Object.entries(updates).forEach(([key, value]) => {
      announceConfigChange(key.replace(/([A-Z])/g, ' $1').toLowerCase(), value as string | boolean | number);
    });
  }, [announceError, announceConfigChange]);

  const copyAll = useCallback(async (): Promise<CopyResult> => {
    try {
      if (!result?.formattedOutput) {
        return {
          type: 'bulk',
          success: false,
          content: ''
        };
      }

      // Use clipboard utility directly (it has built-in fallback logic)
      const copySuccess = await clipboardUtils.copyToClipboard(result.formattedOutput);
      
      // Announce copy result
      if (copySuccess) {
        announceCopySuccess('UUID', result.formattedOutput.split('\n').filter(line => line.trim()).length);
      } else {
        announceError('Failed to copy UUIDs to clipboard');
      }

      return {
        type: 'bulk',
        success: copySuccess,
        content: result.formattedOutput
      };
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      announceError('Failed to copy UUIDs to clipboard');
      return {
        type: 'bulk',
        success: false,
        content: result?.formattedOutput || ''
      };
    }
  }, [result?.formattedOutput, clipboardUtils, announceCopySuccess, announceError]);

  const copySingle = useCallback(async (uuid: string): Promise<CopyResult> => {
    try {
      // Use clipboard utility directly (it has built-in fallback logic)
      const copySuccess = await clipboardUtils.copyToClipboard(uuid);
      
      // Announce copy result
      if (copySuccess) {
        announceCopySuccess('UUID');
      } else {
        announceError('Failed to copy UUID to clipboard');
      }

      return {
        type: 'single',
        success: copySuccess,
        content: uuid
      };
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      announceError('Failed to copy UUID to clipboard');
      return {
        type: 'single',
        success: false,
        content: uuid
      };
    }
  }, [clipboardUtils, announceCopySuccess, announceError]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (performanceTimerRef.current) {
        clearTimeout(performanceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    config,
    result,
    isGenerating,
    error,
    performanceHealth,

    // Actions
    updateConfig,
    regenerate,
    copyAll,
    copySingle
  };
}