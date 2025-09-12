/**
 * API Contracts for UUID Generator Application
 */

import { UUIDGeneratorConfig, FormatOptions } from './index';

// UUID Generation API
export interface UUIDGeneratorAPI {
  /**
   * Generate array of UUIDs based on configuration
   * @throws Error if crypto API unavailable or generation fails
   */
  generateUUIDs(config: UUIDGeneratorConfig): Promise<string[]>;
  
  /**
   * Check if UUID generation is supported in current environment
   */
  isSupported(): boolean;
  
  /**
   * Get fallback UUID generation method if native API unavailable
   */
  getFallbackGenerator?(): (count: number) => string[];
}

// Format Utility API  
export interface FormatUtilsAPI {
  /**
   * Apply formatting options to array of UUIDs
   */
  formatUUIDs(uuids: string[], options: FormatOptions): string;
  
  /**
   * Format single UUID with specific options
   */
  formatSingleUUID(uuid: string, options: FormatOptions): string;
  
  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean;
}

// Storage API
export interface StorageAPI {
  /**
   * Save user preferences to persistent storage
   * @returns Promise resolving to success boolean
   */
  savePreferences(config: UUIDGeneratorConfig): Promise<boolean>;
  
  /**
   * Load user preferences from persistent storage
   * @returns Promise resolving to partial config or empty object
   */
  loadPreferences(): Promise<Partial<UUIDGeneratorConfig>>;
  
  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean;
  
  /**
   * Clear all stored preferences
   */
  clearPreferences(): Promise<void>;
}

// Clipboard API
export interface ClipboardAPI {
  /**
   * Copy text to clipboard
   * @returns Promise resolving to success boolean
   */
  copyToClipboard(text: string): Promise<boolean>;
  
  /**
   * Check if clipboard API is available
   */
  isClipboardAvailable(): boolean;
  
  /**
   * Check if clipboard functionality is supported
   * Alias for isClipboardAvailable for compatibility
   */
  isSupported(): boolean;
  
  /**
   * Get fallback copy method (text selection)
   */
  fallbackCopy?(text: string): boolean;
}