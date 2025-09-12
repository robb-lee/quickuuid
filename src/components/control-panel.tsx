/**
 * ControlPanel Component
 * 
 * UUID generator configuration controls with real-time updates.
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UUIDGeneratorConfig } from "@/types";

interface ControlPanelProps {
  config: UUIDGeneratorConfig;
  onConfigChange: (updates: Partial<UUIDGeneratorConfig>) => void;
  isGenerating: boolean;
  isStorageAvailable?: boolean;
  error?: string;
  performanceHealth?: {
    status: 'good' | 'warning' | 'critical';
    message: string;
    hasActiveIssues: boolean;
  };
}

export function ControlPanel({
  config,
  onConfigChange,
  isGenerating,
  isStorageAvailable = false,
  error,
  performanceHealth
}: ControlPanelProps) {

  return (
    <Card 
      className="w-full" 
      role="form" 
      aria-labelledby="settings-title"
    >
      <CardHeader>
        <CardTitle id="settings-title">
          QuickUUID Settings
        </CardTitle>
        <CardDescription>
          Configure your UUID generation preferences. UUIDs are generated automatically as you change settings.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Generation Settings */}
        <fieldset className="space-y-4" aria-describedby="generation-description">
          <legend className="sr-only">UUID Generation Settings</legend>
          <div id="generation-description" className="sr-only">
            Configure how many UUIDs to generate and other generation options
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="count" className="text-sm font-medium">
              Count
            </Label>
            <Badge variant="outline" className="text-xs" id="count-range">
              1-1000
            </Badge>
          </div>
          <Input
            id="count"
            type="number"
            min="1"
            max="1000"
            value={config.count}
            onChange={(e) => onConfigChange({ count: parseInt(e.target.value) || 1 })}
            className="w-full"
            placeholder="Number of UUIDs to generate"
            aria-describedby="count-range count-help"
            aria-label="Number of UUIDs to generate (1-1000)"
          />
          <div id="count-help" className="sr-only">
            Enter a number between 1 and 1000 to specify how many UUIDs to generate
          </div>
        </fieldset>

        <Separator />

        {/* Format Options */}
        <fieldset className="space-y-4" aria-describedby="format-description">
          <legend className="text-sm font-medium">Format Options</legend>
          <div id="format-description" className="sr-only">
            Choose how to format the generated UUIDs - with or without hyphens, braces, quotes, etc.
          </div>
          
          <div className="grid grid-cols-1 gap-4" role="group" aria-labelledby="format-toggles-label">
            <div id="format-toggles-label" className="sr-only">Format toggle switches</div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hyphens" className="text-sm">
                  Include Hyphens
                </Label>
                <div className="text-xs text-muted-foreground" id="hyphens-example">
                  550e8400-e29b-41d4-a716-446655440000
                </div>
              </div>
              <Switch
                id="hyphens"
                checked={config.includeHyphens}
                onCheckedChange={(checked) => onConfigChange({ includeHyphens: checked })}
                aria-describedby="hyphens-example"
                aria-label={`Include hyphens in UUID format ${config.includeHyphens ? 'enabled' : 'disabled'}`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="braces" className="text-sm">
                  Include Braces
                </Label>
                <div className="text-xs text-muted-foreground" id="braces-example">
                  {"{"}550e8400-e29b-41d4-a716-446655440000{"}"}
                </div>
              </div>
              <Switch
                id="braces"
                checked={config.includeBraces}
                onCheckedChange={(checked) => onConfigChange({ includeBraces: checked })}
                aria-describedby="braces-example"
                aria-label={`Include braces in UUID format ${config.includeBraces ? 'enabled' : 'disabled'}`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quotes" className="text-sm">
                  Include Quotes
                </Label>
                <div className="text-xs text-muted-foreground" id="quotes-example">
                  &quot;550e8400-e29b-41d4-a716-446655440000&quot;
                </div>
              </div>
              <Switch
                id="quotes"
                checked={config.includeQuotes}
                onCheckedChange={(checked) => onConfigChange({ includeQuotes: checked })}
                aria-describedby="quotes-example"
                aria-label={`Include quotes in UUID format ${config.includeQuotes ? 'enabled' : 'disabled'}`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uppercase" className="text-sm">
                  Uppercase
                </Label>
                <div className="text-xs text-muted-foreground" id="uppercase-example">
                  550E8400-E29B-41D4-A716-446655440000
                </div>
              </div>
              <Switch
                id="uppercase"
                checked={config.upperCase}
                onCheckedChange={(checked) => onConfigChange({ upperCase: checked })}
                aria-describedby="uppercase-example"
                aria-label={`Use uppercase letters ${config.upperCase ? 'enabled' : 'disabled'}`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="commas" className="text-sm">
                  Separate with Commas
                </Label>
                <div className="text-xs text-muted-foreground" id="commas-example">
                  uuid1, uuid2, uuid3
                </div>
              </div>
              <Switch
                id="commas"
                checked={config.separateWithCommas}
                onCheckedChange={(checked) => onConfigChange({ separateWithCommas: checked })}
                aria-describedby="commas-example"
                aria-label={`Separate UUIDs with commas ${config.separateWithCommas ? 'enabled' : 'disabled'}`}
              />
            </div>
          </div>
        </fieldset>

        {/* Real-time Status */}
        {isGenerating && (
          <>
            <Separator />
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
              <span>Generating UUIDs...</span>
            </div>
          </>
        )}

        {/* Validation Errors */}
        {error && (
          <div 
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
            aria-labelledby="error-message"
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">⚠️</span>
              <span id="error-message">{error}</span>
            </div>
          </div>
        )}

        {/* Performance Health Alerts */}
        {performanceHealth && performanceHealth.status !== 'good' && (
          <div 
            className={`rounded-md p-3 text-sm ${
              performanceHealth.status === 'critical' 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
            }`}
            role={performanceHealth.status === 'critical' ? 'alert' : 'status'}
            aria-live="polite"
            aria-labelledby="performance-alert-title"
          >
            <div className="flex items-center gap-2">
              <span 
                className="text-base" 
                aria-hidden="true"
                role="img"
                aria-label={performanceHealth.status === 'critical' ? 'Critical alert' : 'Warning'}
              >
                {performanceHealth.status === 'critical' ? '🚨' : '⚠️'}
              </span>
              <div className="flex-1">
                <div id="performance-alert-title" className="font-medium">
                  Performance {performanceHealth.status === 'critical' ? 'Alert' : 'Warning'}
                </div>
                <div className="text-xs mt-1 opacity-90" aria-describedby="performance-alert-title">
                  {performanceHealth.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}