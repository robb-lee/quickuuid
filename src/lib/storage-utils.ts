/**
 * Storage Utilities
 * 
 * Implements the StorageAPI contract for localStorage persistence.
 */

import { StorageAPI } from '@/types/contracts';
import { UUIDGeneratorConfig, defaultConfig, StoredPreferences } from '@/types';

const STORAGE_KEY = 'uuid-generator-preferences';
const SCHEMA_VERSION = '1.0.0';

class StorageUtils implements StorageAPI {
  /**
   * Save user preferences to persistent storage
   */
  async savePreferences(config: UUIDGeneratorConfig): Promise<boolean> {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const nonDefaultConfig = this.filterNonDefaultValues(config);
      
      const storedPreferences: StoredPreferences = {
        version: SCHEMA_VERSION,
        config: nonDefaultConfig,
        lastUsed: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPreferences));
      return true;
    } catch (error) {
      console.warn('Failed to save preferences:', error);
      return false;
    }
  }

  /**
   * Load user preferences from persistent storage
   */
  async loadPreferences(): Promise<Partial<UUIDGeneratorConfig>> {
    if (!this.isStorageAvailable()) {
      return {};
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {};
      }

      const preferences: StoredPreferences = JSON.parse(stored);
      
      // Validate and migrate if necessary
      return this.validateAndMigrate(preferences.config || {});
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return {};
    }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }

      // Test if we can actually use localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored preferences
   */
  async clearPreferences(): Promise<void> {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear preferences:', error);
    }
  }

  /**
   * Filter out default values from config to save space
   */
  private filterNonDefaultValues(config: UUIDGeneratorConfig): Partial<UUIDGeneratorConfig> {
    const nonDefault: Partial<UUIDGeneratorConfig> = {};
    
    // Only store values that differ from defaults
    Object.entries(config).forEach(([key, value]) => {
      const defaultKey = key as keyof UUIDGeneratorConfig;
      if (defaultConfig[defaultKey] !== value) {
        (nonDefault as any)[key] = value;
      }
    });

    return nonDefault;
  }

  /**
   * Validate loaded preferences and migrate if necessary
   */
  private validateAndMigrate(config: Partial<UUIDGeneratorConfig>): Partial<UUIDGeneratorConfig> {
    const validated: Partial<UUIDGeneratorConfig> = {};

    // Validate count
    if (typeof config.count === 'number' && config.count >= 1 && config.count <= 1000) {
      validated.count = config.count;
    }

    // Validate version
    if (config.version === 'v1' || config.version === 'v4') {
      validated.version = config.version;
    }

    // Validate boolean options
    ['includeHyphens', 'includeBraces', 'includeQuotes', 'upperCase', 'separateWithCommas', 'autoCopy'].forEach(key => {
      const configKey = key as keyof UUIDGeneratorConfig;
      if (typeof config[configKey] === 'boolean') {
        (validated as any)[configKey] = config[configKey];
      }
    });

    // Validate theme
    if (config.theme === 'light' || config.theme === 'dark' || config.theme === 'system') {
      validated.theme = config.theme;
    }

    return validated;
  }
}

/**
 * Factory function to create storage utils instance
 */
export function createStorageUtils(): StorageAPI {
  return new StorageUtils();
}