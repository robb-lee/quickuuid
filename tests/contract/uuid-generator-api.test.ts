/**
 * Contract Test: UUIDGeneratorAPI
 * 
 * Tests the UUIDGeneratorAPI contract implementation.
 * These tests MUST FAIL initially (TDD requirement) until implementation is complete.
 */

import { UUIDGeneratorAPI } from '@/types/contracts';
import { UUIDGeneratorConfig, defaultConfig } from '@/types';

// Import the implementation that doesn't exist yet - this will cause test failures
import { createUUIDGenerator } from '@/lib/uuid-generator';

describe('UUIDGeneratorAPI Contract', () => {
  let uuidGenerator: UUIDGeneratorAPI;

  beforeEach(() => {
    // This will fail until implementation exists
    uuidGenerator = createUUIDGenerator();
  });

  describe('generateUUIDs', () => {
    it('should generate correct number of UUIDs', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 5
      };

      const result = await uuidGenerator.generateUUIDs(config);
      
      expect(result).toHaveLength(5);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should generate valid v4 UUIDs by default', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 3
      };

      const result = await uuidGenerator.generateUUIDs(config);
      
      result.forEach(uuid => {
        // v4 UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });
    });

    it('should generate unique UUIDs', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 100
      };

      const result = await uuidGenerator.generateUUIDs(config);
      const uniqueUUIDs = new Set(result);
      
      expect(uniqueUUIDs.size).toBe(result.length);
    });

    it('should handle single UUID generation', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 1
      };

      const result = await uuidGenerator.generateUUIDs(config);
      
      expect(result).toHaveLength(1);
      expect(typeof result[0]).toBe('string');
    });

    it('should handle maximum UUID count', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 1000
      };

      const result = await uuidGenerator.generateUUIDs(config);
      
      expect(result).toHaveLength(1000);
    });

    it('should throw error for invalid count', async () => {
      const invalidConfig: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 0
      };

      await expect(uuidGenerator.generateUUIDs(invalidConfig)).rejects.toThrow();
    });

    it('should throw error for count exceeding maximum', async () => {
      const invalidConfig: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 1001
      };

      await expect(uuidGenerator.generateUUIDs(invalidConfig)).rejects.toThrow();
    });

    it('should throw error when crypto API is unavailable', async () => {
      // Mock crypto as unavailable
      const originalCrypto = global.crypto;
      // @ts-ignore
      delete global.crypto;

      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 1
      };

      await expect(uuidGenerator.generateUUIDs(config)).rejects.toThrow('Crypto API unavailable');
      
      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('isSupported', () => {
    it('should return true when crypto API is available', () => {
      const isSupported = uuidGenerator.isSupported();
      expect(typeof isSupported).toBe('boolean');
      expect(isSupported).toBe(true);
    });

    it('should return false when crypto API is unavailable', () => {
      const originalCrypto = global.crypto;
      // @ts-ignore
      delete global.crypto;

      const isSupported = uuidGenerator.isSupported();
      expect(isSupported).toBe(false);

      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('getFallbackGenerator (optional)', () => {
    it('should provide fallback generator when available', () => {
      if (uuidGenerator.getFallbackGenerator) {
        const fallbackGenerator = uuidGenerator.getFallbackGenerator();
        expect(typeof fallbackGenerator).toBe('function');
        
        const fallbackUUIDs = fallbackGenerator(3);
        expect(fallbackUUIDs).toHaveLength(3);
        expect(Array.isArray(fallbackUUIDs)).toBe(true);
      }
    });

    it('should generate valid UUIDs with fallback', () => {
      if (uuidGenerator.getFallbackGenerator) {
        const fallbackGenerator = uuidGenerator.getFallbackGenerator();
        const fallbackUUIDs = fallbackGenerator(1);
        
        // Should still be valid UUID format (even if not cryptographically strong)
        expect(fallbackUUIDs[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });
  });

  describe('performance requirements', () => {
    it('should generate 1000 UUIDs in under 50ms', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 1000
      };

      const startTime = performance.now();
      await uuidGenerator.generateUUIDs(config);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
    }, 10000); // 10 second timeout for this test

    it('should generate single UUID quickly', async () => {
      const config: UUIDGeneratorConfig = {
        ...defaultConfig,
        count: 1
      };

      const startTime = performance.now();
      await uuidGenerator.generateUUIDs(config);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5); // Should be very fast for single UUID
    });
  });
});