/**
 * Test utilities for @boyscout/node-logger
 *
 * This file provides reusable test utilities, mocks, and helpers
 * for testing the node-logger library components.
 */

import { Log } from '../../src/log.decorator';
import type { LogEntry, LogOptions } from '../../src/types';

// Mock Pino Logger type
export type MockPinoLogger = {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  trace: jest.Mock;
  fatal: jest.Mock;
  child: jest.Mock;
  level: string;
  silent: boolean;
};

// Test data factories
export const createMockPinoLogger = (): MockPinoLogger => ({
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

export const createTestCorrelationId = (suffix?: string): string => {
  const base = 'test-cid';
  return suffix ? `${base}-${suffix}` : `${base}-${Date.now()}`;
};

export const createTestLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: new Date().toISOString(),
  level: 'info',
  scope: { className: 'TestClass', methodName: 'testMethod' },
  outcome: 'success',
  durationMs: 100,
  ...overrides,
});

export const createTestLogOptions = (overrides: Partial<LogOptions> = {}): LogOptions => ({
  level: 'info',
  includeArgs: true,
  includeResult: false,
  sampleRate: 1,
  ...overrides,
});

// Test class factories
export const createTestClass = (options: LogOptions = {}) => {
  class TestClass {
    // @ts-expect-error - Decorator type inference issue
    @Log({ sink: mockSink, ...options })
    testMethod(arg1: string, arg2: number) {
      return `${arg1}-${arg2}`;
    }
  }
  return TestClass;
};

export const createAsyncTestClass = (options: LogOptions = {}) => {
  class TestClass {
    // @ts-expect-error - Decorator type inference issue
    @Log({ sink: mockSink, ...options })
    async testMethod(arg1: string, arg2: number): Promise<string> {
      await Promise.resolve();
      return `${arg1}-${arg2}`;
    }
  }
  return TestClass;
};

// Mock helpers
export const mockSink = jest.fn();
export const mockRedactor = jest.fn((input: unknown) => `redacted-${input}`);
export const mockGetCorrelationId = jest.fn(() => 'test-correlation-id');

// Test assertions helpers
export const expectLogEntry = (entry: LogEntry, expected: Partial<LogEntry>) => {
  for (const [key, value] of Object.entries(expected)) {
    expect(entry[key as keyof LogEntry]).toEqual(value);
  }
};

export const expectMockLoggerCalledWith = (
  mockLogger: MockPinoLogger,
  level: keyof MockPinoLogger,
  expectedPayload: unknown,
  expectedMessage?: string
) => {
  const calls = mockLogger[level].mock.calls;
  expect(calls.length).toBeGreaterThan(0);

  const lastCall = calls[calls.length - 1];
  expect(lastCall[0]).toEqual(expect.objectContaining(expectedPayload));

  if (expectedMessage) {
    expect(lastCall[1]).toContain(expectedMessage);
  }
};

// Cleanup helpers
export const clearAllMocks = (): void => {
  jest.clearAllMocks();
  mockSink.mockClear();
  mockRedactor.mockClear();
  mockGetCorrelationId.mockClear();
};

// Test timeout helper
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), timeoutMs)
    ),
  ]);
};

// Mock correlation ID middleware
export const createMockExpressRequest = (correlationId?: string) => ({
  headers: {
    'x-correlation-id': correlationId || createTestCorrelationId(),
  },
});

export const createMockExpressResponse = () => ({
  setHeader: jest.fn(),
});

export const createMockFastifyRequest = (correlationId?: string) => ({
  headers: {
    'x-correlation-id': correlationId || createTestCorrelationId(),
  },
});

export const createMockFastifyReply = () => ({
  header: jest.fn(),
});

// Test data constants
export const TEST_DATA = {
  SENSITIVE_KEYS: ['password', 'token', 'secret', 'key'],
  SAMPLE_OBJECT: {
    username: 'john_doe',
    password: 'secret123',
    email: 'john@example.com',
    token: 'abc123def456',
  },
  SAMPLE_ARRAY: [
    { name: 'user1', password: 'pass1' },
    { name: 'user2', password: 'pass2' },
  ],
  SAMPLE_ERROR: new Error('Test error message'),
  SAMPLE_CORRELATION_ID: 'test-correlation-123',
} as const;
