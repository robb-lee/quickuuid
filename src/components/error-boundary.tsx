/**
 * ErrorBoundary Component
 * 
 * React error boundary for graceful error handling with user-friendly UI.
 */

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private copyErrorToClipboard = async () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.name}: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
`.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      // Could show a toast here if toast provider is available
      console.log("Error copied to clipboard");
    } catch (err) {
      console.error("Failed to copy error to clipboard:", err);
    }
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred in the UUID Generator application.
                Please try refreshing the page or contact support if the issue persists.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    ERROR
                  </Badge>
                  <span className="text-sm font-medium">
                    {this.state.error?.name || "Unknown Error"}
                  </span>
                </div>
                
                {this.state.error?.message && (
                  <p className="text-sm text-muted-foreground">
                    {this.state.error.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>

                <Button
                  onClick={this.copyErrorToClipboard}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Copy Error Details
                </Button>
              </div>

              {/* Error Details (in development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="space-y-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Show Error Details (Development)
                  </summary>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Error Stack:</h4>
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>

                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Component Stack:</h4>
                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>What you can do:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Click &quot;Try Again&quot; to retry the operation</li>
                  <li>Reload the page to reset the application</li>
                  <li>Check your internet connection</li>
                  <li>Try generating fewer UUIDs if you were generating a large number</li>
                  <li>Clear your browser cache and cookies</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error reporting (to be used in functional components)
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: Record<string, unknown>) => {
    console.error("Application error:", error, errorInfo);
    
    // You could integrate with error reporting services here
    // Example: Sentry, LogRocket, Bugsnag, etc.
  };

  return handleError;
}