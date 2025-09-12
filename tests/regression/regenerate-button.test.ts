/**
 * Regression Tests for Regenerate Button
 * 
 * Tests to prevent regeneration bugs identified during Phase 3.6 integration
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useUUIDGenerator } from '@/hooks/use-uuid-generator';

describe('Regenerate Button - Regression Tests', () => {
  describe('Issue: Regenerate button only generating 1 UUID regardless of count', () => {
    it('should regenerate correct number of UUIDs when count is set to 103', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      // Wait for initial generation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Set count to 103
      act(() => {
        result.current.updateConfig({ count: 103 });
      });

      // Wait for auto-generation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify auto-generation created 103 UUIDs
      expect(result.current.result?.uuids).toHaveLength(103);

      // Now test manual regeneration
      await act(async () => {
        await result.current.regenerate();
      });

      // Verify regenerate also creates 103 UUIDs
      expect(result.current.result?.uuids).toHaveLength(103);
      expect(result.current.result?.uuids.every(uuid => 
        typeof uuid === 'string' && uuid.length > 0
      )).toBe(true);
    });

    it('should regenerate correct number of UUIDs for various counts', async () => {
      const { result } = renderHook(() => useUUIDGenerator());
      const testCounts = [1, 5, 50, 100, 500];

      for (const count of testCounts) {
        // Set count
        act(() => {
          result.current.updateConfig({ count });
        });

        // Wait for auto-generation
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Test regenerate
        await act(async () => {
          await result.current.regenerate();
        });

        expect(result.current.result?.uuids).toHaveLength(count);
      }
    });

    it('should maintain config state during regeneration', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      // Set specific config
      const testConfig = {
        count: 50,
        includeHyphens: false,
        includeBraces: true,
        upperCase: true
      };

      act(() => {
        result.current.updateConfig(testConfig);
      });

      // Wait for auto-generation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const configBeforeRegenerate = result.current.config;

      // Regenerate
      await act(async () => {
        await result.current.regenerate();
      });

      // Verify config unchanged
      expect(result.current.config).toEqual(configBeforeRegenerate);
      
      // Verify UUIDs follow config
      expect(result.current.result?.uuids).toHaveLength(50);
      const firstUuid = result.current.result?.uuids[0] || '';
      expect(firstUuid).toMatch(/^{[A-F0-9]{32}}$/); // No hyphens, with braces, uppercase
    });

    it('should handle edge cases correctly', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      // Test count = 1 (minimum)
      act(() => {
        result.current.updateConfig({ count: 1 });
      });

      await act(async () => {
        await result.current.regenerate();
      });

      expect(result.current.result?.uuids).toHaveLength(1);

      // Test count = 1000 (maximum)
      act(() => {
        result.current.updateConfig({ count: 1000 });
      });

      await act(async () => {
        await result.current.regenerate();
      });

      expect(result.current.result?.uuids).toHaveLength(1000);
    });

    it('should not regenerate when already generating', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      act(() => {
        result.current.updateConfig({ count: 100 });
      });

      // Start first regeneration
      const firstRegenerate = act(async () => {
        await result.current.regenerate();
      });

      // Try to start second regeneration while first is running
      const secondRegenerate = act(async () => {
        await result.current.regenerate();
      });

      // Wait for both to complete
      await Promise.all([firstRegenerate, secondRegenerate]);

      // Should still have correct count
      expect(result.current.result?.uuids).toHaveLength(100);
    });
  });

  describe('Root cause: useCallback dependency issues', () => {
    it('should have regenerate function that captures current config', async () => {
      const { result } = renderHook(() => useUUIDGenerator());

      // Initial config
      act(() => {
        result.current.updateConfig({ count: 10 });
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Store regenerate function reference
      const regenerateRef = result.current.regenerate;

      // Change config
      act(() => {
        result.current.updateConfig({ count: 20 });
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Use old regenerate reference - should use new config
      await act(async () => {
        await regenerateRef();
      });

      // Should generate 20 UUIDs (current config), not 10 (old config)
      expect(result.current.result?.uuids).toHaveLength(20);
    });
  });
});