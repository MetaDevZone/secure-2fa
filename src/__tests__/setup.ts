// Test setup file
process.env['NODE_ENV'] = 'test';

// Mock crypto for consistent testing
let mockCounter = 0;
const hashCache = new Map<string, string>();

jest.mock('crypto', () => ({
  randomBytes: jest.fn((length: number) => {
    const bytes = new Array(length).fill(0).map((_, i) => ((i + mockCounter++) % 256));
    return Buffer.from(bytes);
  }),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hmac-hash'),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn(function(this: any, data: string) {
      this.data = data;
      return this;
    }),
    digest: jest.fn(function(this: any) {
      const key = this.data || '';
      if (!hashCache.has(key)) {
        hashCache.set(key, `mocked-hash-${mockCounter++}`);
      }
      return hashCache.get(key);
    }),
  })),
}));

// Mock bcrypt for consistent testing
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('mocked-bcrypt-hash')),
  compare: jest.fn((input: string, hash: string) => {
    // Return true for any input that matches our mock pattern
    return Promise.resolve(input === '123456' && hash === 'mocked-bcrypt-hash');
  }),
}));

// Global test timeout
jest.setTimeout(10000);
