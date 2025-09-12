/**
 * LoadingSkeleton Component
 * 
 * Provides skeleton loading states for various components during code splitting.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ControlPanelSkeleton() {
  return (
    <Card className="w-full animate-pulse">
      <CardHeader>
        <CardTitle>
          <div className="h-6 bg-muted rounded w-1/2" />
        </CardTitle>
        <div className="h-4 bg-muted rounded w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Version Selection */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
        </div>

        {/* Count Selection */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
        </div>

        <Separator />

        {/* Format Options */}
        <div className="space-y-4">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Performance Section */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultDisplaySkeleton() {
  return (
    <Card className="w-full animate-pulse">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-5 bg-muted rounded w-12" />
            <div className="h-5 bg-muted rounded w-12" />
          </div>
        </CardTitle>
        <div className="h-4 bg-muted rounded w-1/2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded flex-1" />
          <div className="h-9 bg-muted rounded w-24" />
          <div className="h-9 bg-muted rounded w-24" />
        </div>

        <Separator />

        {/* UUID List Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-6 bg-muted rounded w-12" />
          </div>

          {/* UUID List */}
          <div className="h-[300px] bg-muted/30 rounded-md border p-4">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-8 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-64" />
                  </div>
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-4 bg-muted rounded mx-auto w-2/3" />
              <div className="h-6 bg-muted rounded mx-auto w-1/2" />
            </div>
          ))}
        </div>

        {/* Formatted Output */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted/30 rounded-lg border" />
        </div>
      </CardContent>
    </Card>
  );
}

