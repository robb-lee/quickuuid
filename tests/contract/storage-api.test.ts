/**
 * Contract Test: StorageAPI
 * 
 * Tests the StorageAPI contract implementation.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { StorageAPI } from '@/types/contracts';
import { UUIDGeneratorConfig, defaultConfig } from '@/types';

// Import the implementation that doesn't exist yet - this will cause test failures
import { createStorageUtils } from '@/lib/storage-utils';

describe('StorageAPI Contract', () => {
  let storageAPI: StorageAPI;
  const testConfig: UUIDGeneratorConfig = {
    ...defaultConfig,
    count: 5,
    theme: 'dark',
    upperCase: true
  };

  beforeEach(() => {
    // This will fail until implementation exists
    storageAPI = createStorageUtils();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('savePreferences', () => {
    it('should save preferences to localStorage', async () => {
      const success = await storageAPI.savePreferences(testConfig);
      
      expect(success).toBe(true);
      const stored = localStorage.getItem('uuid-generator-preferences');
      expect(stored).toBeTruthy();
    });

    it('should save only non-default values', async () => {
      await storageAPI.savePreferences(testConfig);
      
      const stored = JSON.parse(localStorage.getItem('uuid-generator-preferences') || '{}');
      expect(stored.config).toBeDefined();
      // Should not save default values like version: 'v4'
      expect(stored.config.version).toBeUndefined();
      // Should save non-default values
      expect(stored.config.count).toBe(5);
      expect(stored.config.theme).toBe('dark');
    });

    it('should include schema version and timestamp', async () => {
      await storageAPI.savePreferences(testConfig);
      
      const stored = JSON.parse(localStorage.getItem('uuid-generator-preferences') || '{}');
      expect(stored.version).toBeDefined();
      expect(stored.lastUsed).toBeDefined();
      expect(new Date(stored.lastUsed)).toBeInstanceOf(Date);
    });

    it('should handle storage failures gracefully', async () => {
      // Mock localStorage to throw error more aggressively
      const originalSetItem = localStorage.setItem;
      
      Object.defineProperty(Storage.prototype, 'setItem', {
        value: jest.fn(() => {
          throw new DOMException('QuotaExceededError');
        }),
        writable: true
      });

      const success = await storageAPI.savePreferences(testConfig);
      
      expect(success).toBe(false);
      
      // Restore original function
      Object.defineProperty(Storage.prototype, 'setItem', {
        value: originalSetItem,
        writable: true
      });
    });
  });

  describe('loadPreferences', () => {
    it('should return empty object when no preferences stored', async () => {
      const preferences = await storageAPI.loadPreferences();
      
      expect(preferences).toEqual({});
    });

    it('should load saved preferences', async () => {
      // First save preferences
      await storageAPI.savePreferences(testConfig);
      
      // Then load them
      const preferences = await storageAPI.loadPreferences();
      
      expect(preferences.count).toBe(5);
      expect(preferences.theme).toBe('dark');
      expect(preferences.upperCase).toBe(true);
    });

    it('should handle corrupted storage gracefully', async () => {
      // Set invalid JSON
      localStorage.setItem('uuid-generator-preferences', 'invalid-json');
      
      const preferences = await storageAPI.loadPreferences();
      
      expect(preferences).toEqual({});
    });

    it('should validate loaded data', async () => {
      // Set invalid preferences
      const invalidData = {
        version: '1.0.0',
        config: {
          count: -1, // Invalid count
          theme: 'invalid-theme' // Invalid theme
        },
        lastUsed: new Date().toISOString()
      };
      
      localStorage.setItem('uuid-generator-preferences', JSON.stringify(invalidData));
      
      const preferences = await storageAPI.loadPreferences();
      
      // Should filter out invalid values
      expect(preferences.count).toBeUndefined();
      expect(preferences.theme).toBeUndefined();
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const isAvailable = storageAPI.isStorageAvailable();
      
      expect(isAvailable).toBe(true);
    });

    it('should return false when localStorage is not available', () => {
      // Mock localStorage as undefined
      const originalLocalStorage = global.localStorage;
      // @ts-ignore
      delete global.localStorage;

      const isAvailable = storageAPI.isStorageAvailable();
      
      expect(isAvailable).toBe(false);
      
      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });

    it('should return false when localStorage throws errors', () => {
      // Mock localStorage to throw error on access
      const originalLocalStorage = localStorage;
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Storage disabled');
        }
      });

      const isAvailable = storageAPI.isStorageAvailable();
      
      expect(isAvailable).toBe(false);
      
      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });
  });

  describe('clearPreferences', () => {
    it('should clear stored preferences', async () => {
      // First save preferences
      await storageAPI.savePreferences(testConfig);
      expect(localStorage.getItem('uuid-generator-preferences')).toBeTruthy();
      
      // Then clear them
      await storageAPI.clearPreferences();
      
      expect(localStorage.getItem('uuid-generator-preferences')).toBeNull();
    });

    it('should handle clear operation when no preferences exist', async () => {
      // Should not throw error
      await expect(storageAPI.clearPreferences()).resolves.not.toThrow();
    });

    it('should handle storage errors during clear', async () => {
      // Mock localStorage to throw error
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      // Should not throw error
      await expect(storageAPI.clearPreferences()).resolves.not.toThrow();
      
      // Restore original function
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('performance requirements', () => {
    it('should save preferences quickly', async () => {
      const startTime = performance.now();
      await storageAPI.savePreferences(testConfig);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // Should be very fast
    });

    it('should load preferences quickly', async () => {
      await storageAPI.savePreferences(testConfig);
      
      const startTime = performance.now();
      await storageAPI.loadPreferences();
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5); // Should be extremely fast
    });
  });
});