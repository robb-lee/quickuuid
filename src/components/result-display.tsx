/**
 * ResultDisplay Component
 * 
 * Displays generated UUIDs with copy functionality and performance metrics.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Download, RotateCcw } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { VirtualizedUUIDList } from "@/components/virtualized-uuid-list";
import { createFormatUtils } from "@/lib/format-utils";

interface ResultDisplayProps {
  result?: {
    uuids: string[];
    formattedOutput: string;
    performanceMetrics: {
      generationTimeMs: number;
      formatTimeMs: number;
    };
  };
  config?: {
    includeHyphens: boolean;
    includeBraces: boolean;
    includeQuotes: boolean;
    upperCase: boolean;
    separateWithCommas: boolean;
  };
  onCopyAll: () => Promise<boolean>;
  onCopySingle: (uuid: string) => Promise<boolean>;
  onRegenerate: () => void;
  isGenerating: boolean;
  error?: string;
}

export function ResultDisplay({
  result,
  config,
  onCopyAll,
  onCopySingle,
  onRegenerate,
  isGenerating,
  error
}: ResultDisplayProps) {
  const [bulkCopied, setBulkCopied] = useState(false);
  
  // Create format utils for individual UUID formatting
  const formatUtils = useMemo(() => createFormatUtils(), []);
  
  // Format individual UUID based on current config
  const formatSingleUUID = (uuid: string) => {
    if (!config) return uuid;
    return formatUtils.formatUUIDs([uuid], {
      includeHyphens: config.includeHyphens,
      includeBraces: config.includeBraces,
      includeQuotes: config.includeQuotes,
      upperCase: config.upperCase,
      separateWithCommas: false // Never use commas for single UUID
    });
  };


  // Handle bulk copy
  const handleCopyAll = async () => {
    try {
      const success = await onCopyAll();
      if (success) {
        setBulkCopied(true);
        setTimeout(() => setBulkCopied(false), 2000);
      }
      return success;
    } catch (error) {
      console.error('handleCopyAll error:', error);
      return false;
    }
  };

  // Handle download as file
  const handleDownload = () => {
    if (!result) return;
    
    const blob = new Blob([result.formattedOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uuids-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full" data-testid="uuid-results" role="region" aria-labelledby="results-title">
      <CardHeader>
        <CardTitle id="results-title" className="flex items-center justify-between">
          Generated UUIDs
          {result && (
            <Badge variant="secondary" className="text-xs">
              {result.performanceMetrics.generationTimeMs.toFixed(1)}ms
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {result 
            ? `${result.uuids.length} UUID${result.uuids.length !== 1 ? 's' : ''} generated successfully`
            : "Configuring UUID generation..."
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div 
            className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="text-sm text-destructive">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" 
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">Generating UUIDs...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isGenerating && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="UUID actions">
              <CopyButton
                text={result.formattedOutput}
                onCopy={handleCopyAll}
                variant="default"
                size="sm"
                className="flex-1"
                data-testid="copy-all-button"
                aria-label={`Copy all ${result.uuids.length} UUIDs to clipboard`}
              >
                {bulkCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    Copied All!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    Copy All ({result.uuids.length})
                  </>
                )}
              </CopyButton>

              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                aria-label="Download UUIDs as text file"
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Download
              </Button>

              <Button
                onClick={onRegenerate}
                variant="outline"
                size="sm"
                aria-label="Generate new UUIDs"
              >
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Regenerate
              </Button>
            </div>

            <Separator />

            {/* UUID List */}
            <section className="space-y-2" aria-labelledby="uuid-list-title">
              <div className="flex items-center justify-between">
                <h4 id="uuid-list-title" className="text-sm font-medium">Individual UUIDs</h4>
              </div>

              {/* Memory-optimized virtualized list for large datasets */}
              <VirtualizedUUIDList
                uuids={result.uuids}
                config={config}
                onCopySingle={onCopySingle}
                formatSingleUUID={formatSingleUUID}
                height={300}
              />
            </section>


            {/* Formatted Output Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Formatted Output</h4>
              <div className="p-4 bg-muted/30 rounded-lg border">
                <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                  {result.formattedOutput}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!result && !isGenerating && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-4xl">🎲</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  UUIDs will be generated automatically as you configure your settings.
                  All generated UUIDs will appear here with copy functionality.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}