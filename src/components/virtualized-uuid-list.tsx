/**
 * VirtualizedUUIDList Component
 * 
 * Memory-optimized virtualized list for displaying large quantities of UUIDs.
 * Only renders visible items to minimize memory usage.
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { UUIDCopyButton } from "@/components/copy-button";

interface VirtualizedUUIDListProps {
  uuids: string[];
  config?: {
    includeHyphens: boolean;
    includeBraces: boolean;
    includeQuotes: boolean;
    upperCase: boolean;
    separateWithCommas: boolean;
  };
  onCopySingle: (uuid: string) => Promise<boolean>;
  formatSingleUUID: (uuid: string) => string;
  height?: number;
}

const ITEM_HEIGHT = 60; // Height of each UUID item in pixels
const OVERSCAN = 5; // Number of items to render outside visible area

export function VirtualizedUUIDList({
  uuids,
  config,
  onCopySingle,
  formatSingleUUID,
  height = 300
}: VirtualizedUUIDListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range based on scroll position
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(height / ITEM_HEIGHT),
      uuids.length
    );

    return {
      start: Math.max(0, visibleStart - OVERSCAN),
      end: Math.min(uuids.length, visibleEnd + OVERSCAN),
      visibleStart,
      visibleEnd
    };
  }, [scrollTop, height, uuids.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return uuids.slice(visibleRange.start, visibleRange.end).map((uuid, index) => ({
      uuid,
      index: visibleRange.start + index,
      actualIndex: index
    }));
  }, [uuids, visibleRange]);

  // Handle scroll events with debouncing for performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Handle individual UUID copy
  const handleCopySingle = async (uuid: string, index: number) => {
    const success = await onCopySingle(uuid);
    if (success) {
      setCopiedStates(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }));
      }, 2000);
    }
    return success;
  };

  // Cleanup copied states for items no longer visible
  useEffect(() => {
    setCopiedStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(key => {
        const index = parseInt(key);
        if (index < visibleRange.start || index >= visibleRange.end) {
          delete newStates[index];
        }
      });
      return newStates;
    });
  }, [visibleRange]);

  if (uuids.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No UUIDs to display
      </div>
    );
  }

  // For small lists (≤ 50), render all items without virtualization
  if (uuids.length <= 50) {
    return (
      <div 
        className="space-y-2 max-h-[300px] overflow-y-auto rounded-md border p-4"
        data-testid="uuid-list-small"
      >
        <ul className="space-y-2" role="list">
          {uuids.map((uuid, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              role="listitem"
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className="text-xs min-w-[2rem]"
                  aria-label={`UUID number ${index + 1}`}
                >
                  {index + 1}
                </Badge>
                <code 
                  className="text-sm font-mono"
                  aria-label={`UUID value: ${formatSingleUUID(uuid)}`}
                >
                  {formatSingleUUID(uuid)}
                </code>
              </div>
              
              <UUIDCopyButton
                uuid={uuid}
                index={index}
                onCopy={() => handleCopySingle(uuid, index)}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // For large lists (> 50), use virtualization
  return (
    <div 
      ref={containerRef}
      className="relative rounded-md border"
      style={{ height }}
      data-testid="uuid-list-virtualized"
      role="region"
      aria-label={`Virtualized list of ${uuids.length} UUIDs`}
      aria-describedby="virtualized-list-description"
    >
      <div id="virtualized-list-description" className="sr-only">
        Scrollable list showing {visibleItems.length} of {uuids.length} UUIDs. 
        Use arrow keys or scroll to navigate.
      </div>

      {/* Virtual scrollbar container */}
      <div
        className="overflow-auto p-4"
        style={{ height: '100%' }}
        onScroll={handleScroll}
        role="list"
        tabIndex={0}
        aria-label="Scrollable UUID list"
      >
        {/* Total height placeholder */}
        <div style={{ height: uuids.length * ITEM_HEIGHT, position: 'relative' }}>
          {/* Visible items */}
          <div
            style={{
              position: 'absolute',
              top: visibleRange.start * ITEM_HEIGHT,
              width: '100%'
            }}
          >
            <ul className="space-y-2">
              {visibleItems.map(({ uuid, index }) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  style={{ height: ITEM_HEIGHT - 8 }} // Account for spacing
                  role="listitem"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className="text-xs min-w-[2rem]"
                      aria-label={`UUID number ${index + 1}`}
                    >
                      {index + 1}
                    </Badge>
                    <code 
                      className="text-sm font-mono truncate max-w-[300px]"
                      aria-label={`UUID value: ${formatSingleUUID(uuid)}`}
                      title={formatSingleUUID(uuid)}
                    >
                      {formatSingleUUID(uuid)}
                    </code>
                  </div>
                  
                  <UUIDCopyButton
                    uuid={uuid}
                    index={index}
                    onCopy={() => handleCopySingle(uuid, index)}
                    copied={copiedStates[index] || false}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Scroll position indicator for large lists */}
      {uuids.length > 100 && (
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded px-2 py-1 text-xs text-muted-foreground border">
          {visibleRange.visibleStart + 1}-{Math.min(visibleRange.visibleEnd, uuids.length)} of {uuids.length}
        </div>
      )}
    </div>
  );
}