/**
 * UUID Generator Utility
 * 
 * Implements the UUIDGeneratorAPI contract for generating UUIDs.
 */

import { UUIDGeneratorAPI } from '@/types/contracts';
import { UUIDGeneratorConfig } from '@/types';

class UUIDGenerator implements UUIDGeneratorAPI {
  /**
   * Generate array of UUIDs based on configuration
   */
  async generateUUIDs(config: UUIDGeneratorConfig): Promise<string[]> {
    // Validate count
    if (config.count < 1 || config.count > 1000) {
      throw new Error('Count must be between 1 and 1000');
    }

    // Check if crypto API is available
    if (!this.isSupported()) {
      throw new Error('Crypto API unavailable');
    }

    // Use optimized batch generation for large quantities
    if (config.count > 100) {
      return this.generateUUIDBatch(config);
    }

    const uuids: string[] = [];
    
    // Generate UUIDs
    for (let i = 0; i < config.count; i++) {
      let uuid: string;
      
      if (config.version === 'v4') {
        // Use native crypto.randomUUID if available
        if (crypto.randomUUID) {
          uuid = crypto.randomUUID();
        } else {
          // Fallback implementation for v4 UUID
          uuid = this.generateV4UUID();
        }
      } else {
        throw new Error(`UUID version ${config.version} not supported yet`);
      }
      
      uuids.push(uuid);
    }

    return uuids;
  }

  /**
   * Generate UUIDs in optimized batches for large quantities
   */
  private async generateUUIDBatch(config: UUIDGeneratorConfig): Promise<string[]> {
    const batchSize = 50; // Process in chunks to avoid blocking
    const batches = Math.ceil(config.count / batchSize);
    const uuids: string[] = [];

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, config.count);
      const currentBatchSize = endIndex - startIndex;

      // Generate batch with optimized methods
      const batchUUIDs = await this.generateBatch(currentBatchSize, config.version);
      uuids.push(...batchUUIDs);

      // Yield control to prevent blocking the main thread for large batches
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return uuids;
  }

  /**
   * Generate a single batch of UUIDs with optimized crypto operations
   */
  private async generateBatch(count: number, version: string): Promise<string[]> {
    if (version !== 'v4') {
      throw new Error(`UUID version ${version} not supported yet`);
    }

    const uuids: string[] = [];

    // Use native crypto.randomUUID if available (most efficient)
    if (crypto.randomUUID) {
      for (let i = 0; i < count; i++) {
        uuids.push(crypto.randomUUID());
      }
      return uuids;
    }

    // Batch crypto.getRandomValues calls for better performance
    if (crypto.getRandomValues) {
      // Generate all random bytes at once
      const totalBytes = count * 16;
      const allBytes = new Uint8Array(totalBytes);
      crypto.getRandomValues(allBytes);

      // Process bytes in chunks to create UUIDs
      for (let i = 0; i < count; i++) {
        const offset = i * 16;
        const bytes = allBytes.slice(offset, offset + 16);
        
        // Set version (4 bits)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        
        // Set variant (2 bits)  
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        
        // Convert to hex string with hyphens
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        
        const uuid = [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32)
        ].join('-');
        
        uuids.push(uuid);
      }
      
      return uuids;
    }

    // Fallback to individual generation
    for (let i = 0; i < count; i++) {
      uuids.push(this.generateV4UUID());
    }

    return uuids;
  }

  /**
   * Check if UUID generation is supported in current environment
   */
  isSupported(): boolean {
    try {
      return typeof crypto !== 'undefined' && 
             (typeof crypto.randomUUID === 'function' || typeof crypto.getRandomValues === 'function');
    } catch {
      return false;
    }
  }

  /**
   * Get fallback UUID generation method if native API unavailable
   */
  getFallbackGenerator(): (count: number) => string[] {
    return (count: number) => {
      const uuids: string[] = [];
      for (let i = 0; i < count; i++) {
        uuids.push(this.generateV4UUID());
      }
      return uuids;
    };
  }

  /**
   * Generate v4 UUID using crypto.getRandomValues
   */
  private generateV4UUID(): string {
    if (crypto.getRandomValues) {
      // RFC 4122 version 4 UUID
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      
      // Set version (4 bits)
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      
      // Set variant (2 bits)  
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      
      // Convert to hex string with hyphens
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      
      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32)
      ].join('-');
    } else {
      // Last resort fallback using Math.random (not cryptographically secure)
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }
}

/**
 * Factory function to create UUID generator instance
 */
export function createUUIDGenerator(): UUIDGeneratorAPI {
  return new UUIDGenerator();
}