/**
 * Regression Tests for Infinite Loop Prevention
 * 
 * Tests to prevent useEffect dependency cycle issues identified during Phase 3.6 integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useUUIDGenerator } from '@/hooks/use-uuid-generator';

describe('Infinite Loop Prevention - Regression Tests', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console to detect excessive function calls
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Issue: useEffect dependency cycle causing infinite regeneration', () => {
    it('should not cause infinite regeneration loop on hook initialization', async () => {
      let regenerationCount = 0;
      
      // Mock the UUID generator to count calls
      const mockGenerateUUIDs = jest.fn().mockImplementation(() => {
        regenerationCount++;
        return Promise.resolve(['mock-uuid-1']);
      });

      // Mock the utility functions
      jest.doMock('@/lib/uuid-generator', () => ({
        createUUIDGenerator: () => ({
          generateUUIDs: mockGenerateUUIDs,
        }),
      }));

      const { result } = renderHook(() => useUUIDGenerator());

      // Wait for initial generation
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Should have called generateUUIDs exactly once for initial generation
      expect(regenerationCount).toBe(1);
      expect(mockGenerateUUIDs).toHaveBeenCalledTimes(1);

      // Wait more time to ensure no additional calls
      await act(async () => {
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
      });

      // Should still be only one call
      expect(regenerationCount).toBe(1);
      expect(mockGenerateUUIDs).toHaveBeenCalledTimes(1);
    });

    it('should regenerate exactly once per config change', async () => {
      let regenerationCount = 0;
      
      const mockGenerateUUIDs = jest.fn().mockImplementation(() => {
        regenerationCount++;
        return Promise.resolve([`mock-uuid-${regenerationCount}`]);
      });

      jest.doMock('@/lib/uuid-generator', () => ({
        createUUIDGenerator: () => ({
          generateUUIDs: mockGenerateUUIDs,
        }),
      }));

      const { result } = renderHook(() => useUUIDGenerator());

      // Wait for initial generation
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      const initialCount = regenerationCount;

      // Change config
      act(() => {
        result.current.updateConfig({ count: 5 });
      });

      // Wait for regeneration
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      // Should have exactly one additional call
      expect(regenerationCount).toBe(initialCount + 1);

      // Wait more time to ensure no additional calls
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      // Should still be only one additional call
      expect(regenerationCount).toBe(initialCount + 1);
    });

    it('should not create dependency cycle with useCallback functions', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      // Wait for initial render
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      const initialRegenerate = result.current.regenerate;
      const initialUpdateConfig = result.current.updateConfig;

      // Change config multiple times
      act(() => {
        result.current.updateConfig({ count: 10 });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      act(() => {
        result.current.updateConfig({ includeHyphens: false });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      // Function references should remain stable or change predictably
      // (This prevents unnecessary re-renders and dependency cycles)
      expect(typeof result.current.regenerate).toBe('function');
      expect(typeof result.current.updateConfig).toBe('function');
      
      // Functions should work correctly
      await act(async () => {
        await result.current.regenerate();
      });

      expect(result.current.result).toBeTruthy();
    });

    it('should handle rapid config changes without loop', async () => {
      let regenerationCount = 0;
      
      const mockGenerateUUIDs = jest.fn().mockImplementation(() => {
        regenerationCount++;
        return Promise.resolve([`uuid-${regenerationCount}`]);
      });

      jest.doMock('@/lib/uuid-generator', () => ({
        createUUIDGenerator: () => ({
          generateUUIDs: mockGenerateUUIDs,
        }),
      }));

      const { result } = renderHook(() => useUUIDGenerator());

      // Wait for initial generation
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      const initialCount = regenerationCount;

      // Make rapid config changes
      act(() => {
        result.current.updateConfig({ count: 5 });
        result.current.updateConfig({ count: 10 });
        result.current.updateConfig({ count: 15 });
        result.current.updateConfig({ includeHyphens: false });
        result.current.updateConfig({ upperCase: true });
      });

      // Wait for all changes to process
      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      // Should have reasonable number of regenerations (batched/debounced)
      const finalCount = regenerationCount;
      const additionalCalls = finalCount - initialCount;
      
      // Should not have called generateUUIDs more than a few times
      // (Exact number depends on batching implementation)
      expect(additionalCalls).toBeLessThan(10);
      expect(additionalCalls).toBeGreaterThan(0);
    });

    it('should prevent memory leaks from uncancelled effects', async () => {
      const { result, unmount } = renderHook(() => useUUIDGenerator());

      // Wait for initial generation
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      // Start a config change but unmount before completion
      act(() => {
        result.current.updateConfig({ count: 100 });
      });

      // Unmount immediately
      unmount();

      // Advance timers to see if any cleanup issues occur
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Should not have any console errors from cleanup issues
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Root cause: useCallback dependency arrays', () => {
    it('should handle config object changes without causing cycles', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      // Wait for initial render
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      const config1 = result.current.config;
      
      // Update config
      act(() => {
        result.current.updateConfig({ count: 50 });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      const config2 = result.current.config;

      // Configs should be different objects but functions should remain stable
      expect(config1).not.toBe(config2);
      expect(config1.count).not.toBe(config2.count);
      
      // But this shouldn't cause infinite regeneration
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      // Should have stable result
      expect(result.current.result).toBeTruthy();
      expect(result.current.result?.uuids).toHaveLength(50);
    });

    it('should maintain function identity correctly', async () => {
      const { result, rerender } = renderHook(() => useUUIDGenerator());

      // Wait for initial render
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      const functions1 = {
        regenerate: result.current.regenerate,
        updateConfig: result.current.updateConfig,
        copyAll: result.current.copyAll,
        copySingle: result.current.copySingle,
      };

      // Force re-render
      rerender();

      const functions2 = {
        regenerate: result.current.regenerate,
        updateConfig: result.current.updateConfig,
        copyAll: result.current.copyAll,
        copySingle: result.current.copySingle,
      };

      // updateConfig and copyAll/copySingle should be stable
      expect(functions1.updateConfig).toBe(functions2.updateConfig);
      expect(functions1.copyAll).toBe(functions2.copyAll);
      expect(functions1.copySingle).toBe(functions2.copySingle);
      
      // regenerate might change due to config dependency, but should not cause loops
    });
  });
});