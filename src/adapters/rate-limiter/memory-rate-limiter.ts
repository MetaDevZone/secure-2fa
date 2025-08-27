import { RateLimiterAdapter } from '../../types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class MemoryRateLimiterAdapter implements RateLimiterAdapter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  async checkLimit(key: string, limit: number, _windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      return true; // No previous requests
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      this.limits.delete(key);
      return true;
    }

    return entry.count < limit;
  }

  async increment(key: string, windowMs: number = 60000): Promise<void> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First request in this window
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else if (now > entry.resetTime) {
      // Window has expired, reset
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Increment existing count
      this.limits.set(key, {
        count: entry.count + 1,
        resetTime: entry.resetTime,
      });
    }
  }

  async reset(key: string): Promise<void> {
    this.limits.delete(key);
  }

  // Helper method for testing
  clear(): void {
    this.limits.clear();
  }

  // Helper method to get current count for testing
  getCount(key: string): number {
    const entry = this.limits.get(key);
    return entry ? entry.count : 0;
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }

  // Automatic cleanup to prevent memory leaks
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
    
    // Unref to prevent keeping the process alive
    if (this.cleanupInterval) {
      this.cleanupInterval.unref();
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    });
  }
}
