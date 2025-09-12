/**
 * Main UUID Generator Page
 * 
 * Integrates all components into a cohesive UUID generation application.
 */

"use client";

import { Suspense, lazy } from "react";
import { useUUIDGenerator } from "@/hooks/use-uuid-generator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ErrorBoundary } from "@/components/error-boundary";
import { ClientOnly } from "@/components/client-only";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { useFocusManagement } from "@/hooks/use-focus-management";
import { ControlPanelSkeleton, ResultDisplaySkeleton } from "@/components/loading-skeleton";
import { DiceIcon } from "@/components/dice-icon";
import "@/styles/focus.css";

// Dynamic imports for code splitting
const ControlPanel = lazy(() => import("@/components/control-panel").then(mod => ({ default: mod.ControlPanel })));
const ResultDisplay = lazy(() => import("@/components/result-display").then(mod => ({ default: mod.ResultDisplay })));

export default function HomePage() {
  const {
    config,
    result,
    isGenerating,
    error,
    performanceHealth,
    updateConfig,
    regenerate,
    copyAll,
    copySingle
  } = useUUIDGenerator();

  const handleCopyAll = async () => {
    const copyResult = await copyAll();
    return copyResult.success;
  };

  const handleCopySingle = async (uuid: string) => {
    const copyResult = await copySingle(uuid);
    return copyResult.success;
  };


  // Focus management
  const { 
    containerRef, 
    clearFocus,
    isKeyboardUser 
  } = useFocusManagement({
    skipLinks: true,
    highContrastMode: true,
    restoreFocus: true
  });

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => {
      clearFocus();
    },
    onEnter: () => {
      // If focus is on a regenerate-like element, trigger regeneration
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement?.getAttribute('data-keyboard-action') === 'regenerate') {
        regenerate();
      }
    },
    enabled: true
  });

  return (
    <ErrorBoundary>
      <div 
        ref={containerRef}
        className={`min-h-screen bg-background ${isKeyboardUser ? 'js-focus-visible' : ''}`}
      >
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DiceIcon size={28} className="text-primary" />
                  <div>
                    <h1 className="text-xl font-semibold">QuickUUID</h1>
                    <p className="text-sm text-muted-foreground">
                      Fast, secure, and customizable UUID generation
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main 
          id="main-content" 
          className="container mx-auto px-4 py-8" 
          tabIndex={-1}
        >
          <ClientOnly fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              <div className="space-y-6">
                <div className="p-6 bg-card rounded-lg border animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-8 bg-muted rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </div>
              <div>
                <div className="p-6 bg-card rounded-lg border animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          }>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* Left Column - Controls */}
              <div className="space-y-6">
                <div className="lg:sticky lg:top-24">
                  <Suspense fallback={<ControlPanelSkeleton />}>
                    <ControlPanel
                      config={config}
                      onConfigChange={updateConfig}
                      isGenerating={isGenerating}
                      isStorageAvailable={typeof Storage !== 'undefined'}
                      error={error}
                      performanceHealth={performanceHealth}
                    />
                  </Suspense>

                </div>
              </div>

              {/* Right Column - Results */}
              <div>
                <Suspense fallback={<ResultDisplaySkeleton />}>
                  <ResultDisplay
                    result={result}
                    config={config}
                    onCopyAll={handleCopyAll}
                    onCopySingle={handleCopySingle}
                    onRegenerate={regenerate}
                    isGenerating={isGenerating}
                    error={error}
                  />
                </Suspense>
              </div>
            </div>
          </ClientOnly>
        </main>

      </div>
    </ErrorBoundary>
  );
}
