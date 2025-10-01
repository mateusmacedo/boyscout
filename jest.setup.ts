// Global configurations for tests
// Timezone configurations for tests
process.env.TZ = 'UTC';

// Console configurations to reduce noise in tests
// Store original console methods in a way that avoids redeclaration issues
interface GlobalWithConsole {
  __originalConsole?: {
    error: typeof console.error;
    warn: typeof console.warn;
    log: typeof console.log;
  };
}

const storeOriginalConsole = () => {
  const globalWithConsole = global as GlobalWithConsole;
  if (!globalWithConsole.__originalConsole) {
    globalWithConsole.__originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
    };
  }
  return globalWithConsole.__originalConsole;
};

beforeAll(() => {
  const originalConsole = storeOriginalConsole();

  // Suppress specific warnings that are not relevant for Node.js libraries
  console.error = (...args: Parameters<typeof console.error>) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('DeprecationWarning'))
    ) {
      return;
    }
    originalConsole.error.call(console, ...args);
  };

  console.warn = (...args: Parameters<typeof console.warn>) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('DeprecationWarning'))
    ) {
      return;
    }
    originalConsole.warn.call(console, ...args);
  };

  // Suppress logs during tests unless explicitly needed
  console.log = jest.fn();
});

afterAll(() => {
  const originalConsole = storeOriginalConsole();
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
});

// Global timeout configurations
jest.setTimeout(10000);

// Mock crypto for consistent UUID generation in tests
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9012-345678901234'),
}));
