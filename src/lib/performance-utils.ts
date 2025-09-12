/**
 * Performance Monitoring Utility
 * 
 * Implements performance tracking for UUID generation operations.
 */

import { PerformanceMetrics } from '@/types';

export interface PerformanceAlert {
  type: 'warning' | 'error';
  operation: string;
  message: string;
  currentValue: number;
  threshold: number;
  recommendation?: string;
  timestamp: Date;
}

export interface PerformanceThresholds {
  uuidGeneration: {
    warning: number;  // ms
    error: number;    // ms
  };
  formatting: {
    warning: number;  // ms
    error: number;    // ms
  };
  total: {
    warning: number;  // ms
    error: number;    // ms
  };
  memoryUsage: {
    warning: number;  // MB
    error: number;    // MB
  };
}

export class PerformanceUtils {
  static startTimer(): number {
    return performance.now();
  }

  static endTimer(startTime: number): number {
    return performance.now() - startTime;
  }
}

interface TimingEntry {
  id: string;
  operation: string;
  startTime: number;
}

// Default performance thresholds based on requirements
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  uuidGeneration: {
    warning: 50,  // 50ms for UUID generation (more realistic for various devices)
    error: 100    // 100ms maximum 
  },
  formatting: {
    warning: 20,  // 20ms for formatting (doubled from 10ms)
    error: 40     // 40ms maximum
  },
  total: {
    warning: 80,  // 80ms total operation (doubled from 40ms)
    error: 150    // 150ms maximum total
  },
  memoryUsage: {
    warning: 15,  // 15MB (slightly increased)
    error: 50     // 50MB maximum
  }
};

class PerformanceMonitor {
  private activeTimings = new Map<string, TimingEntry>();
  private completedMetrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private consecutiveFailures: Map<string, number> = new Map();
  private readonly CONSECUTIVE_THRESHOLD = 3; // Show warning after 3 consecutive failures

  /**
   * Start timing a generation operation
   */
  startTiming(operation: string): string {
    const timingId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeTimings.set(timingId, {
      id: timingId,
      operation,
      startTime: performance.now()
    });

    return timingId;
  }

  /**
   * End timing and get duration
   */
  endTiming(timingId: string): number {
    const timing = this.activeTimings.get(timingId);
    
    if (!timing) {
      console.warn(`No active timing found for ID: ${timingId}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - timing.startTime;
    
    // Create metrics entry
    const metrics: PerformanceMetrics = {
      operation: timing.operation,
      duration,
      timestamp: new Date(),
      metadata: {
        timingId,
        startTime: timing.startTime,
        endTime
      }
    };

    // Store completed metrics
    this.completedMetrics.push(metrics);
    
    // Check for performance alerts
    this.checkPerformanceAlerts(timing.operation, duration);
    
    // Clean up active timing
    this.activeTimings.delete(timingId);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.completedMetrics.length > 100) {
      this.completedMetrics = this.completedMetrics.slice(-100);
    }

    return duration;
  }

  /**
   * Log performance metrics
   */
  logMetrics(metrics: PerformanceMetrics): void {
    console.log(`Performance: ${metrics.operation} took ${metrics.duration.toFixed(2)}ms`, {
      operation: metrics.operation,
      duration: metrics.duration,
      timestamp: metrics.timestamp,
      metadata: metrics.metadata
    });
  }

  /**
   * Get recent performance metrics
   */
  getRecentMetrics(operation?: string, limit = 10): PerformanceMetrics[] {
    let filtered = this.completedMetrics;
    
    if (operation) {
      filtered = filtered.filter(m => m.operation === operation);
    }
    
    return filtered.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const metrics = this.completedMetrics.filter(m => m.operation === operation);
    
    if (metrics.length === 0) {
      return 0;
    }
    
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / metrics.length;
  }

  /**
   * Check if operation meets performance requirements
   */
  meetsPerformanceTarget(operation: string, targetMs: number): boolean {
    const avgDuration = this.getAverageDuration(operation);
    return avgDuration <= targetMs;
  }

  /**
   * Check performance against thresholds and generate alerts
   */
  private checkPerformanceAlerts(operation: string, duration: number): void {
    let threshold: { warning: number; error: number } | undefined;
    let operationName = '';
    let recommendations: { warning: string; error: string } = { warning: '', error: '' };

    // Map operations to thresholds and recommendations
    if (operation.toLowerCase().includes('uuid') || operation.toLowerCase().includes('generat')) {
      threshold = this.thresholds.uuidGeneration;
      operationName = 'UUID Generation';
      recommendations = {
        warning: 'Performance seems slower than usual. This may be temporary.',
        error: 'UUID generation is critically slow. Try reducing the count or refreshing the page.'
      };
    } else if (operation.toLowerCase().includes('format')) {
      threshold = this.thresholds.formatting;
      operationName = 'UUID Formatting';
      recommendations = {
        warning: 'Formatting is taking longer than expected. Consider simplifying format options.',
        error: 'Formatting is critically slow. Try using simpler format options.'
      };
    } else {
      // Default to total thresholds
      threshold = this.thresholds.total;
      operationName = 'Total Operation';
      recommendations = {
        warning: 'Performance is slower than optimal but within acceptable limits.',
        error: 'Performance is critically degraded. Try refreshing the page or reducing the UUID count.'
      };
    }

    if (!threshold) return;

    const key = operationName;
    const isSlowPerformance = duration >= threshold.warning;
    const isCritical = duration >= threshold.error;

    if (isSlowPerformance) {
      // Track consecutive failures
      const currentCount = this.consecutiveFailures.get(key) || 0;
      this.consecutiveFailures.set(key, currentCount + 1);

      // Only show warning/error if we have consecutive failures
      const shouldAlert = isCritical || (currentCount + 1) >= this.CONSECUTIVE_THRESHOLD;

      if (shouldAlert) {
        const alert: PerformanceAlert = {
          type: isCritical ? 'error' : 'warning',
          operation: operationName,
          message: isCritical ? recommendations.error : recommendations.warning,
          currentValue: duration,
          threshold: isCritical ? threshold.error : threshold.warning,
          recommendation: isCritical ? recommendations.error : recommendations.warning,
          timestamp: new Date()
        };
        
        this.addAlert(alert);
        
        if (isCritical) {
          console.error('🚨 Performance Alert:', alert);
        } else {
          console.warn('⚠️ Performance Warning:', alert);
        }
      }
    } else {
      // Performance is good, reset consecutive failures
      this.consecutiveFailures.set(key, 0);
    }
  }

  /**
   * Add alert and manage alert history
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 20 alerts to prevent memory leaks
    if (this.alerts.length > 20) {
      this.alerts = this.alerts.slice(-20);
    }
  }

  /**
   * Get recent performance alerts
   */
  getAlerts(type?: 'warning' | 'error', limit = 5): PerformanceAlert[] {
    let filtered = this.alerts;
    
    if (type) {
      filtered = filtered.filter(alert => alert.type === type);
    }
    
    return filtered.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Check if there are any active performance issues
   */
  hasActiveIssues(): boolean {
    // Check recent alerts (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
    
    return recentAlerts.some(alert => alert.type === 'error');
  }

  /**
   * Get performance health status
   */
  getHealthStatus(): { status: 'good' | 'warning' | 'critical'; message: string; alerts: PerformanceAlert[] } {
    const recentAlerts = this.getAlerts(undefined, 3);
    const hasErrors = recentAlerts.some(alert => alert.type === 'error');
    const hasWarnings = recentAlerts.some(alert => alert.type === 'warning');

    if (hasErrors) {
      return {
        status: 'critical',
        message: 'Performance issues detected that may impact user experience',
        alerts: recentAlerts.filter(alert => alert.type === 'error')
      };
    } else if (hasWarnings) {
      return {
        status: 'warning',
        message: 'Performance is slower than optimal but within acceptable limits',
        alerts: recentAlerts.filter(alert => alert.type === 'warning')
      };
    } else {
      return {
        status: 'good',
        message: 'Performance is within optimal ranges',
        alerts: []
      };
    }
  }

  /**
   * Clear all stored metrics and alerts
   */
  clearMetrics(): void {
    this.completedMetrics = [];
    this.activeTimings.clear();
    this.alerts = [];
  }
}

// Global instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Utility functions for easy performance monitoring
 */
export const PerformanceManager = {
  /**
   * Start timing an operation
   */
  startTiming: (operation: string) => performanceMonitor.startTiming(operation),

  /**
   * End timing and get duration
   */
  endTiming: (timingId: string) => performanceMonitor.endTiming(timingId),

  /**
   * Log performance metrics
   */
  logMetrics: (metrics: PerformanceMetrics) => performanceMonitor.logMetrics(metrics),

  /**
   * Time an async operation
   */
  async timeAsync<T>(operation: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const timingId = performanceMonitor.startTiming(operation);
    try {
      const result = await fn();
      const duration = performanceMonitor.endTiming(timingId);
      return { result, duration };
    } catch (error) {
      performanceMonitor.endTiming(timingId);
      throw error;
    }
  },

  /**
   * Time a synchronous operation
   */
  timeSync<T>(operation: string, fn: () => T): { result: T; duration: number } {
    const timingId = performanceMonitor.startTiming(operation);
    try {
      const result = fn();
      const duration = performanceMonitor.endTiming(timingId);
      return { result, duration };
    } catch (error) {
      performanceMonitor.endTiming(timingId);
      throw error;
    }
  },

  /**
   * Get performance statistics
   */
  getStats: (operation?: string, limit?: number) => performanceMonitor.getRecentMetrics(operation, limit),

  /**
   * Check performance targets
   */
  meetsTarget: (operation: string, targetMs: number) => performanceMonitor.meetsPerformanceTarget(operation, targetMs),

  /**
   * Clear all metrics
   */
  clear: () => performanceMonitor.clearMetrics(),

  /**
   * Get performance alerts
   */
  getAlerts: (type?: 'warning' | 'error', limit?: number) => performanceMonitor.getAlerts(type, limit),

  /**
   * Check for active performance issues
   */
  hasActiveIssues: () => performanceMonitor.hasActiveIssues(),

  /**
   * Get overall performance health status
   */
  getHealthStatus: () => performanceMonitor.getHealthStatus()
};