/**
 * Error Recovery Utilities
 * 
 * Provides automatic retry mechanisms and error recovery strategies.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
}

export interface ErrorRecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  recoveryStrategy?: string;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<ErrorRecoveryResult<T>> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    backoffMultiplier = 2,
    maxDelay = 5000
  } = options;

  let lastError: Error = new Error('Unknown error');
  let attempts = 0;

  for (let i = 0; i <= maxRetries; i++) {
    attempts = i + 1;
    
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts,
        recoveryStrategy: attempts > 1 ? 'retry-with-backoff' : undefined
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't wait after the last attempt
      if (i < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, i), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    recoveryStrategy: 'retry-failed'
  };
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<ErrorRecoveryResult<T>> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        return {
          success: false,
          error: new Error('Circuit breaker is open - service unavailable'),
          attempts: 0,
          recoveryStrategy: 'circuit-breaker-open'
        };
      } else {
        this.state = 'half-open';
      }
    }

    try {
      const data = await fn();
      this.onSuccess();
      return {
        success: true,
        data,
        attempts: 1,
        recoveryStrategy: this.state === 'half-open' ? 'circuit-breaker-recovery' : undefined
      };
    } catch (error) {
      this.onFailure();
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        attempts: 1,
        recoveryStrategy: 'circuit-breaker-failure'
      };
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Generic error recovery strategies
 */
export class ErrorRecovery {
  private static circuitBreaker = new CircuitBreaker();

  /**
   * Attempt to recover from UUID generation failures
   */
  static async recoverUUIDGeneration<T>(
    primaryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>
  ): Promise<ErrorRecoveryResult<T>> {
    // Try primary function with retry
    const primaryResult = await retryWithBackoff(primaryFn, {
      maxRetries: 2,
      initialDelay: 50
    });

    if (primaryResult.success) {
      return primaryResult;
    }

    // If primary fails and we have a fallback, try it
    if (fallbackFn) {
      try {
        const data = await fallbackFn();
        return {
          success: true,
          data,
          attempts: primaryResult.attempts + 1,
          recoveryStrategy: 'fallback-strategy'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          attempts: primaryResult.attempts + 1,
          recoveryStrategy: 'fallback-failed'
        };
      }
    }

    return primaryResult;
  }

  /**
   * Recover from clipboard failures
   */
  static async recoverClipboard(
    text: string,
    primaryMethod: () => Promise<boolean>,
    fallbackMethod?: () => Promise<boolean>
  ): Promise<ErrorRecoveryResult<boolean>> {
    // Try primary clipboard method
    const primaryResult = await retryWithBackoff(primaryMethod, {
      maxRetries: 1,
      initialDelay: 100
    });

    if (primaryResult.success) {
      return primaryResult;
    }

    // Try fallback method (e.g., document.execCommand)
    if (fallbackMethod) {
      try {
        const success = await fallbackMethod();
        return {
          success,
          data: success,
          attempts: primaryResult.attempts + 1,
          recoveryStrategy: success ? 'clipboard-fallback' : 'clipboard-fallback-failed'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          attempts: primaryResult.attempts + 1,
          recoveryStrategy: 'clipboard-fallback-error'
        };
      }
    }

    return primaryResult;
  }

  /**
   * Recover from storage failures
   */
  static async recoverStorage<T>(
    key: string,
    value: T,
    primaryStorage: () => Promise<void>,
    fallbackStorage?: () => Promise<void>
  ): Promise<ErrorRecoveryResult<void>> {
    const primaryResult = await retryWithBackoff(primaryStorage, {
      maxRetries: 1
    });

    if (primaryResult.success) {
      return primaryResult;
    }

    if (fallbackStorage) {
      try {
        await fallbackStorage();
        return {
          success: true,
          attempts: primaryResult.attempts + 1,
          recoveryStrategy: 'storage-fallback'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          attempts: primaryResult.attempts + 1,
          recoveryStrategy: 'storage-fallback-failed'
        };
      }
    }

    return primaryResult;
  }
}