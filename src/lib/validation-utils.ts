/**
 * Validation Utilities
 * 
 * Provides validation functions for user input and configuration.
 */

import { UUIDGeneratorConfig, ValidationResult, ValidationError } from '@/types';

export class ValidationUtils {
  /**
   * Validate UUID generator configuration
   */
  static validateConfig(config: Partial<UUIDGeneratorConfig>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate count
    if (config.count !== undefined) {
      const countError = this.validateCount(config.count);
      if (countError) {
        errors.push(countError);
      }
    }

    // Validate version
    if (config.version !== undefined) {
      const versionError = this.validateVersion(config.version);
      if (versionError) {
        errors.push(versionError);
      }
    }

    // Validate theme
    if (config.theme !== undefined) {
      const themeError = this.validateTheme(config.theme);
      if (themeError) {
        errors.push(themeError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate count value
   */
  static validateCount(count: any): ValidationError | null {
    if (typeof count !== 'number') {
      return {
        field: 'count',
        message: 'Please enter a valid number for UUID count',
        code: 'INVALID_TYPE'
      };
    }

    if (!Number.isInteger(count)) {
      return {
        field: 'count',
        message: 'UUID count must be a whole number (no decimals)',
        code: 'INVALID_INTEGER'
      };
    }

    if (count < 1) {
      return {
        field: 'count',
        message: 'You need to generate at least 1 UUID',
        code: 'COUNT_TOO_LOW'
      };
    }

    if (count > 1000) {
      return {
        field: 'count',
        message: 'Maximum of 1000 UUIDs allowed per generation for performance reasons',
        code: 'COUNT_TOO_HIGH'
      };
    }

    return null;
  }

  /**
   * Validate UUID version
   */
  static validateVersion(version: any): ValidationError | null {
    if (typeof version !== 'string') {
      return {
        field: 'version',
        message: 'Version must be a string',
        code: 'INVALID_TYPE'
      };
    }

    const validVersions = ['v1', 'v4'];
    if (!validVersions.includes(version)) {
      return {
        field: 'version',
        message: `Version must be one of: ${validVersions.join(', ')}`,
        code: 'INVALID_VERSION'
      };
    }

    return null;
  }

  /**
   * Validate theme setting
   */
  static validateTheme(theme: any): ValidationError | null {
    if (typeof theme !== 'string') {
      return {
        field: 'theme',
        message: 'Theme must be a string',
        code: 'INVALID_TYPE'
      };
    }

    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(theme)) {
      return {
        field: 'theme',
        message: `Theme must be one of: ${validThemes.join(', ')}`,
        code: 'INVALID_THEME'
      };
    }

    return null;
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: any): ValidationError | null {
    if (typeof uuid !== 'string') {
      return {
        field: 'uuid',
        message: 'UUID must be a string',
        code: 'INVALID_TYPE'
      };
    }

    // Standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuid)) {
      return {
        field: 'uuid',
        message: 'Invalid UUID format',
        code: 'INVALID_UUID_FORMAT'
      };
    }

    return null;
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim() // Remove leading/trailing whitespace
      .slice(0, 1000); // Limit length
  }

  /**
   * Validate configuration and provide user-friendly messages
   */
  static getValidationMessage(field: string, value: any): string | null {
    switch (field) {
      case 'count':
        const countError = this.validateCount(value);
        if (countError) {
          switch (countError.code) {
            case 'INVALID_TYPE':
            case 'INVALID_INTEGER':
              return 'Please enter a valid number';
            case 'COUNT_TOO_LOW':
              return 'Count must be at least 1';
            case 'COUNT_TOO_HIGH':
              return 'Count must be at most 1000';
            default:
              return countError.message;
          }
        }
        break;

      case 'version':
        const versionError = this.validateVersion(value);
        if (versionError) {
          return 'Please select a valid UUID version';
        }
        break;

      case 'theme':
        const themeError = this.validateTheme(value);
        if (themeError) {
          return 'Please select a valid theme option';
        }
        break;
    }

    return null;
  }

  /**
   * Check if value is safe for localStorage
   */
  static isSafeForStorage(value: any): boolean {
    try {
      const serialized = JSON.stringify(value);
      
      // Check size (localStorage typically has ~5-10MB limit)
      if (serialized.length > 100000) { // 100KB limit for safety
        return false;
      }

      // Ensure it can be parsed back
      JSON.parse(serialized);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate performance metrics
   */
  static validatePerformanceTarget(operation: string, duration: number, targetMs: number): boolean {
    return typeof duration === 'number' && 
           duration > 0 && 
           duration <= targetMs;
  }
}