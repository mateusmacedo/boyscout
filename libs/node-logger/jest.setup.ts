/**
 * Jest setup file for @boyscout/node-logger
 *
 * This file configures Jest for testing the node-logger library,
 * including console mocking, test utilities, and global configurations.
 */

import type { LogEntry } from './src/types';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
};

// Mock console to avoid pollution in test logs
beforeAll(() => {
  // Suppress specific warnings that are not relevant for Node.js libraries
  console.error = (...args: Parameters<typeof console.error>) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ExperimentalWarning') ||
        args[0].includes('DeprecationWarning') ||
        args[0].includes('Warning:') ||
        args[0].includes('node:') ||
        args[0].includes('Buffer is deprecated'))
    ) {
      return;
    }
    originalConsole.error(...args);
  };

  console.warn = (...args: Parameters<typeof console.warn>) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ExperimentalWarning') ||
        args[0].includes('DeprecationWarning') ||
        args[0].includes('Warning:') ||
        args[0].includes('node:') ||
        args[0].includes('Buffer is deprecated'))
    ) {
      return;
    }
    originalConsole.warn(...args);
  };

  // Silence other console methods during tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  console.trace = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

// Helper to clear all mocks between tests
export const clearMockLogger = (): void => {
  for (const mock of Object.values(mockLogger)) {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  }
};

// Helper to create a mock Pino logger
export const createMockPinoLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(),
  level: 'info',
  silent: false,
});

// Helper to create test correlation IDs
export const createTestCorrelationId = (suffix?: string): string => {
  const base = 'test-cid';
  return suffix ? `${base}-${suffix}` : `${base}-${Date.now()}`;
};

// Helper to create test log entries
export const createTestLogEntry = (overrides: Partial<LogEntry> = {}) => ({
  timestamp: new Date().toISOString(),
  level: 'info',
  scope: { className: 'TestClass', methodName: 'testMethod' },
  outcome: 'success',
  durationMs: 100,
  ...overrides,
});

// Global test timeout for async operations
jest.setTimeout(10000);
