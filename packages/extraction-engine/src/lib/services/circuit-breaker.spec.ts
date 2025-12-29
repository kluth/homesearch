import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CircuitBreaker, CircuitState } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      successThreshold: 2,
    });
  });

  describe('Closed State (Normal Operation)', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute function in closed state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should count failures', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      await expect(breaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(breaker.execute(mockFn)).rejects.toThrow('failure');

      expect(breaker.getStats().failures).toBe(2);
    });

    it('should open after reaching failure threshold', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Fail 3 times (threshold)
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Open State (Circuit Broken)', () => {
    beforeEach(async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();
    });

    it('should reject immediately in open state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      await expect(breaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');

      // Function should not be called
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should transition to half-open after reset timeout', async () => {
      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe('Half-Open State (Testing Recovery)', () => {
    beforeEach(async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();

      // Wait for half-open
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    it('should allow limited requests in half-open state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should close after success threshold in half-open', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      // Success threshold is 2
      await breaker.execute(mockFn);
      await breaker.execute(mockFn);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen on failure in half-open state', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('still failing'));

      await expect(breaker.execute(mockFn)).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistics', () => {
    it('should track success count', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      await breaker.execute(mockFn);
      await breaker.execute(mockFn);
      await breaker.execute(mockFn);

      const stats = breaker.getStats();
      expect(stats.successes).toBe(3);
      expect(stats.failures).toBe(0);
    });

    it('should track failure count', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();

      const stats = breaker.getStats();
      expect(stats.successes).toBe(0);
      expect(stats.failures).toBe(2);
    });

    it('should track rejection count', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      await expect(breaker.execute(failFn)).rejects.toThrow();
      await expect(breaker.execute(failFn)).rejects.toThrow();
      await expect(breaker.execute(failFn)).rejects.toThrow();

      const mockFn = jest.fn();

      // Try to call when open
      await expect(breaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
      await expect(breaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');

      const stats = breaker.getStats();
      expect(stats.rejections).toBe(2);
    });
  });

  describe('Reset', () => {
    it('should reset circuit to closed state', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();
      await expect(breaker.execute(mockFn)).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getStats().failures).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should use custom failure threshold', async () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 1000,
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Fail 4 times (below threshold)
      for (let i = 0; i < 4; i++) {
        await expect(customBreaker.execute(mockFn)).rejects.toThrow();
      }

      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);

      // Fail 5th time (meets threshold)
      await expect(customBreaker.execute(mockFn)).rejects.toThrow();

      expect(customBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });
});
