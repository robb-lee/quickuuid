/**
 * Format Utilities
 * 
 * Implements the FormatUtilsAPI contract for UUID formatting.
 */

import { FormatUtilsAPI } from '@/types/contracts';
import { FormatOptions } from '@/types';

class FormatUtils implements FormatUtilsAPI {
  /**
   * Apply formatting options to array of UUIDs
   */
  formatUUIDs(uuids: string[], options: FormatOptions): string {
    if (uuids.length === 0) {
      return '';
    }

    const formattedUUIDs = uuids.map(uuid => this.formatSingleUUID(uuid, options));
    
    if (options.separateWithCommas && uuids.length > 1) {
      return formattedUUIDs.join(',');
    }
    
    return formattedUUIDs.join('\n');
  }

  /**
   * Format single UUID with specific options
   */
  formatSingleUUID(uuid: string, options: FormatOptions): string {
    let formatted = uuid;
    
    // Remove hyphens if requested
    if (!options.includeHyphens) {
      formatted = formatted.replace(/-/g, '');
    }
    
    // Convert case
    if (options.upperCase) {
      formatted = formatted.toUpperCase();
    } else {
      formatted = formatted.toLowerCase();
    }
    
    // Add quotes if requested
    if (options.includeQuotes) {
      formatted = `"${formatted}"`;
    }
    
    // Add braces if requested
    if (options.includeBraces) {
      formatted = `{${formatted}}`;
    }
    
    return formatted;
  }

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }
    
    // Standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

/**
 * Factory function to create format utils instance
 */
export function createFormatUtils(): FormatUtilsAPI {
  return new FormatUtils();
}