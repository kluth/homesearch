/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit broken, rejecting calls
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /**
   * Number of failures before opening circuit
   */
  failureThreshold: number;

  /**
   * Time in milliseconds before attempting to close circuit
   */
  resetTimeout: number;

  /**
   * Number of successes in half-open state before closing circuit
   */
  successThreshold?: number;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  successes: number;
  failures: number;
  rejections: number;
  lastStateChange: Date | null;
}

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping calls to failing services
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private rejectionCount = 0;
  private lastFailureTime: number | null = null;
  private lastStateChange: Date | null = null;
  private resetTimer: NodeJS.Timeout | null = null;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;

  constructor(config: CircuitBreakerConfig) {
    this.failureThreshold = config.failureThreshold;
    this.resetTimeout = config.resetTimeout;
    this.successThreshold = config.successThreshold ?? 2;
  }

  /**
   * Execute a function through the circuit breaker
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    this.checkStateTransition();

    // Reject immediately if circuit is open
    if (this.state === CircuitState.OPEN) {
      this.rejectionCount++;
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  public getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      successes: this.successCount,
      failures: this.failureCount,
      rejections: this.rejectionCount,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Reset the circuit breaker to closed state
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.rejectionCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = new Date();

    if (this.resetTimer != null) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.successCount = 0;
      }
    } else {
      this.successCount++;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately reopen on failure in half-open state
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failureCount >= this.failureThreshold) {
      // Open circuit if threshold reached
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Check if circuit should transition from OPEN to HALF_OPEN
   */
  private checkStateTransition(): void {
    if (
      this.state === CircuitState.OPEN &&
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.resetTimeout
    ) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    if (newState === CircuitState.OPEN) {
      // Schedule transition to half-open
      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }

      this.resetTimer = setTimeout(() => {
        this.transitionTo(CircuitState.HALF_OPEN);
      }, this.resetTimeout);
    } else if (newState === CircuitState.CLOSED) {
      // Clear any pending timers
      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
      }
      this.successCount = 0;
      this.failureCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }
  }
}
