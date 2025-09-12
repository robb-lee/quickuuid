/**
 * Core type definitions for UUID Generator Application
 */

export interface UUIDGeneratorConfig {
  // Generation settings
  count: number;                    // 1-1000, number of UUIDs to generate
  version: 'v1' | 'v4';            // UUID version (v4 default, v1 future)
  
  // Format options
  includeHyphens: boolean;          // Include hyphens in UUID format
  includeBraces: boolean;           // Wrap UUIDs in curly braces {}
  includeQuotes: boolean;           // Wrap UUIDs in double quotes ""
  upperCase: boolean;               // Convert to uppercase
  separateWithCommas: boolean;      // Separate multiple UUIDs with commas
  
  // UI preferences  
  theme: 'light' | 'dark' | 'system'; // Theme preference
  autoCopy: boolean;                // Auto-copy on generation (future)
}

export interface UUIDGenerationResult {
  uuids: string[];                  // Array of generated UUIDs
  formattedOutput: string;          // Final formatted string for display/copy
  generatedAt: Date;                // Timestamp of generation
  config: UUIDGeneratorConfig;      // Configuration used for generation
  performanceMetrics?: {
    generationTimeMs: number;       // Time taken to generate UUIDs
    formatTimeMs: number;           // Time taken to format output
  };
}

export interface ClipboardOperation {
  content: string;                  // Content that was copied
  type: 'single' | 'bulk';         // Type of copy operation
  success: boolean;                 // Whether copy was successful
  timestamp: Date;                  // When copy occurred
  feedback?: string;                // User feedback message
}

export interface ApplicationState {
  config: UUIDGeneratorConfig;
  currentResult?: UUIDGenerationResult;
  isGenerating: boolean;
  lastError?: string;
  recentCopies: ClipboardOperation[];
}

export interface StoredPreferences {
  version: string;                  // Schema version for migration
  config: Partial<UUIDGeneratorConfig>; // Only non-default values stored
  lastUsed: string;                 // ISO date string
}

export interface FormatOptions {
  includeHyphens: boolean;
  includeBraces: boolean;  
  includeQuotes: boolean;
  upperCase: boolean;
  separateWithCommas: boolean;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const defaultConfig: UUIDGeneratorConfig = {
  count: 1,
  version: 'v4',
  includeHyphens: true,
  includeBraces: false,
  includeQuotes: false,
  upperCase: false,
  separateWithCommas: false,
  theme: 'system',
  autoCopy: false
};