import { RateLimiterAdapter } from '../../types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class MemoryRateLimiterAdapter implements RateLimiterAdapter {
  private limits: Map<string, RateLimitEntry> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkLimit(key: string, limit: number, _windowMs: number): Promise<boolean> {
    // _windowMs is not used in this implementation but required by interface
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

  async increment(key: string): Promise<void> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First request in this window
      this.limits.set(key, {
        count: 1,
        resetTime: now + 60000, // Default 1 minute window
      });
    } else if (now > entry.resetTime) {
      // Window has expired, reset
      this.limits.set(key, {
        count: 1,
        resetTime: now + 60000,
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
}
