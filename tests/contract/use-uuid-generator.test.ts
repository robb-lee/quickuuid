/**
 * Contract Test: useUUIDGenerator Hook
 * 
 * Tests the useUUIDGenerator hook contract implementation.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { renderHook, act } from '@testing-library/react';
import { UUIDGeneratorConfig, defaultConfig } from '@/types';

// Import the implementation that doesn't exist yet - this will cause test failures
import { useUUIDGenerator } from '@/hooks/use-uuid-generator';

describe('useUUIDGenerator Hook Contract', () => {
  it('should initialize with default configuration', () => {
    const { result } = renderHook(() => useUUIDGenerator());

    expect(result.current.config).toEqual(defaultConfig);
    expect(result.current.result).toBeUndefined();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should initialize with custom configuration', () => {
    const customConfig: Partial<UUIDGeneratorConfig> = {
      count: 5,
      theme: 'dark',
      upperCase: true
    };

    const { result } = renderHook(() => useUUIDGenerator(customConfig));

    expect(result.current.config).toEqual({
      ...defaultConfig,
      ...customConfig
    });
  });

  it('should provide updateConfig function', () => {
    const { result } = renderHook(() => useUUIDGenerator());

    expect(typeof result.current.updateConfig).toBe('function');
  });

  it('should update configuration', () => {
    const { result } = renderHook(() => useUUIDGenerator());

    act(() => {
      result.current.updateConfig({ count: 10, upperCase: true });
    });

    expect(result.current.config.count).toBe(10);
    expect(result.current.config.upperCase).toBe(true);
    expect(result.current.config.version).toBe('v4'); // Should preserve other values
  });

  it('should trigger regeneration when config changes', async () => {
    const { result } = renderHook(() => useUUIDGenerator());

    await act(async () => {
      result.current.updateConfig({ count: 3 });
    });

    // Should have generated UUIDs
    expect(result.current.result).toBeDefined();
    expect(result.current.result?.uuids).toHaveLength(3);
    expect(result.current.isGenerating).toBe(false);
  });

  it('should provide regenerate function', () => {
    const { result } = renderHook(() => useUUIDGenerator());

    expect(typeof result.current.regenerate).toBe('function');
  });

  it('should regenerate UUIDs manually', async () => {
    const { result } = renderHook(() => useUUIDGenerator({ count: 2 }));

    // First generation
    await act(async () => {
      await result.current.regenerate();
    });

    const firstResult = result.current.result;
    expect(firstResult?.uuids).toHaveLength(2);

    // Second generation should be different
    await act(async () => {
      await result.current.regenerate();
    });

    const secondResult = result.current.result;
    expect(secondResult?.uuids).toHaveLength(2);
    expect(secondResult?.uuids).not.toEqual(firstResult?.uuids);
  });

  it('should set isGenerating during generation', async () => {
    const { result } = renderHook(() => useUUIDGenerator());

    let generatingStates: boolean[] = [];

    // Monitor isGenerating state changes
    const unsubscribe = () => {
      generatingStates.push(result.current.isGenerating);
    };

    await act(async () => {
      unsubscribe(); // Initial state
      const promise = result.current.regenerate();
      unsubscribe(); // Should be true during generation
      await promise;
      unsubscribe(); // Should be false after completion
    });

    expect(generatingStates[0]).toBe(false); // Initial
    expect(generatingStates[1]).toBe(true);  // During generation
    expect(generatingStates[2]).toBe(false); // After completion
  });

  it('should provide copyAll function', () => {
    const { result } = renderHook(() => useUUIDGenerator());

    expect(typeof result.current.copyAll).toBe('function');
  });

  it('should copy all generated UUIDs', async () => {
    const { result } = renderHook(() => useUUIDGenerator({ count: 3 }));

    // First generate some UUIDs
    await act(async () => {
      await result.current.regenerate();
    });

    // Then copy them
    let copyResult;
    await act(async () => {
      copyResult = await result.current.copyAll();
    });

    expect(copyResult).toBeDefined();
    expect(copyResult.type).toBe('bulk');
    expect(copyResult.success).toBe(true);
    expect(copyResult.content).toContain(result.current.result?.uuids[0]);
  });

  it('should provide copySingle function', () => {
    const { result } = renderHook(() => useUUIDGenerator());

    expect(typeof result.current.copySingle).toBe('function');
  });

  it('should copy single UUID', async () => {
    const { result } = renderHook(() => useUUIDGenerator({ count: 3 }));

    // First generate some UUIDs
    await act(async () => {
      await result.current.regenerate();
    });

    const testUUID = result.current.result?.uuids[1] || '';

    // Then copy single UUID
    let copyResult;
    await act(async () => {
      copyResult = await result.current.copySingle(testUUID);
    });

    expect(copyResult).toBeDefined();
    expect(copyResult.type).toBe('single');
    expect(copyResult.success).toBe(true);
    expect(copyResult.content).toBe(testUUID);
  });

  it('should handle generation errors', async () => {
    const { result } = renderHook(() => useUUIDGenerator());

    // Mock crypto as unavailable to trigger error
    const originalCrypto = global.crypto;
    // @ts-ignore
    delete global.crypto;

    await act(async () => {
      try {
        await result.current.regenerate();
      } catch (e) {
        // Expected to fail
      }
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isGenerating).toBe(false);

    // Restore crypto
    global.crypto = originalCrypto;
  });

  it('should clear errors on successful generation', async () => {
    const { result } = renderHook(() => useUUIDGenerator());

    // First cause an error
    const originalCrypto = global.crypto;
    // @ts-ignore
    delete global.crypto;

    await act(async () => {
      try {
        await result.current.regenerate();
      } catch (e) {
        // Expected to fail
      }
    });

    expect(result.current.error).toBeDefined();

    // Restore crypto and regenerate successfully
    global.crypto = originalCrypto;

    await act(async () => {
      await result.current.regenerate();
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeDefined();
  });

  it('should handle copy failures gracefully', async () => {
    const { result } = renderHook(() => useUUIDGenerator({ count: 1 }));

    // Generate UUIDs first
    await act(async () => {
      await result.current.regenerate();
    });

    // Mock clipboard to fail
    const originalClipboard = navigator.clipboard;
    // @ts-ignore
    delete navigator.clipboard;

    let copyResult;
    await act(async () => {
      copyResult = await result.current.copyAll();
    });

    expect(copyResult.success).toBe(false);

    // Restore clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true
    });
  });

  it('should persist preferences to localStorage', async () => {
    const { result } = renderHook(() => useUUIDGenerator());

    await act(async () => {
      result.current.updateConfig({ 
        count: 5, 
        theme: 'dark',
        upperCase: true 
      });
    });

    // Check that preferences were saved
    const stored = localStorage.getItem('uuid-generator-preferences');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored || '{}');
    expect(parsed.config.count).toBe(5);
    expect(parsed.config.theme).toBe('dark');
    expect(parsed.config.upperCase).toBe(true);
  });

  it('should load preferences from localStorage on init', () => {
    // Set preferences in localStorage
    const preferences = {
      version: '1.0.0',
      config: {
        count: 7,
        theme: 'light',
        includeBraces: true
      },
      lastUsed: new Date().toISOString()
    };
    
    localStorage.setItem('uuid-generator-preferences', JSON.stringify(preferences));

    const { result } = renderHook(() => useUUIDGenerator());

    expect(result.current.config.count).toBe(7);
    expect(result.current.config.theme).toBe('light');
    expect(result.current.config.includeBraces).toBe(true);
    // Default values should still be present
    expect(result.current.config.version).toBe('v4');
  });

  it('should format UUIDs according to configuration', async () => {
    const { result } = renderHook(() => useUUIDGenerator({ 
      count: 2,
      includeHyphens: false,
      upperCase: true,
      separateWithCommas: true
    }));

    await act(async () => {
      await result.current.regenerate();
    });

    const formattedOutput = result.current.result?.formattedOutput || '';
    
    expect(formattedOutput).not.toContain('-'); // No hyphens
    expect(formattedOutput).toMatch(/[A-F0-9]/); // Uppercase
    expect(formattedOutput).toContain(','); // Comma separated
  });

  it('should include performance metrics', async () => {
    const { result } = renderHook(() => useUUIDGenerator({ count: 1000 }));

    await act(async () => {
      await result.current.regenerate();
    });

    const metrics = result.current.result?.performanceMetrics;
    expect(metrics).toBeDefined();
    expect(typeof metrics?.generationTimeMs).toBe('number');
    expect(typeof metrics?.formatTimeMs).toBe('number');
    expect(metrics?.generationTimeMs).toBeGreaterThan(0);
  });

  describe('performance requirements', () => {
    it('should generate 1000 UUIDs in under 50ms', async () => {
      const { result } = renderHook(() => useUUIDGenerator({ count: 1000 }));

      const startTime = performance.now();
      await act(async () => {
        await result.current.regenerate();
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
      expect(result.current.result?.uuids).toHaveLength(1000);
    }, 10000);
  });

  afterEach(() => {
    localStorage.clear();
  });
});