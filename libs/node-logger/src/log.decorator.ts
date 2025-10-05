import { randomBytes } from 'node:crypto';
import { getCid } from './context.js';
import { createLogger } from './logger/logger.factory.js';
import { createRedactor } from './redact.js';
import type { LogEntry, LogOptions } from './types.js';

// Import reflect-metadata for NestJS compatibility
import 'reflect-metadata';

const isPromise = (v: unknown): v is Promise<unknown> =>
  !!v && typeof v === 'object' && typeof (v as Promise<unknown>).then === 'function';

/**
 * Generates a cryptographically secure random number between 0 and 1
 * Uses crypto.randomBytes() instead of Math.random() for security
 */
const getSecureRandom = (): number => {
  const bytes = randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return value / (0xffffffff + 1);
};

const defaultRedactor = createRedactor();

// Create default logger with sensible defaults
const defaultLogger = createLogger({
  service: process.env.SERVICE_NAME || 'node-logger',
  env: process.env.NODE_ENV || 'development',
  version: process.env.SERVICE_VERSION || '1.0.0',
  redact: defaultRedactor,
  getCorrelationId: getCid,
});

/**
 * Preserves existing metadata from other decorators (like NestJS decorators)
 * This is crucial for framework compatibility
 */
function preserveMetadata(
  target: object,
  propertyKey: string | symbol,
  newDescriptor: PropertyDescriptor
): PropertyDescriptor {
  // Get all existing metadata keys
  const metadataKeys = Reflect.getMetadataKeys(target, propertyKey);

  // Store existing metadata to restore later
  const existingMetadata = new Map();
  for (const key of metadataKeys) {
    const value = Reflect.getMetadata(key, target, propertyKey);
    existingMetadata.set(key, value);
  }

  // Create a clean PropertyDescriptor without conflicts
  const preservedDescriptor: PropertyDescriptor = {
    configurable: newDescriptor.configurable ?? true,
    enumerable: newDescriptor.enumerable ?? false,
    writable: newDescriptor.writable ?? true,
    value: newDescriptor.value,
  };

  // Only add get/set if they exist and value is not present
  if (newDescriptor.get && !newDescriptor.value) {
    preservedDescriptor.get = newDescriptor.get;
  }
  if (newDescriptor.set && !newDescriptor.value) {
    preservedDescriptor.set = newDescriptor.set;
  }

  // Restore existing metadata after creating the descriptor
  for (const [key, value] of existingMetadata) {
    Reflect.defineMetadata(key, value, target, propertyKey);
  }

  return preservedDescriptor;
}

export function Log(opts: LogOptions = {}) {
  const {
    level = 'info',
    includeArgs = true,
    includeResult = false,
    sampleRate = 1,
    redact = defaultRedactor,
    sink,
    getCorrelationId = getCid,
    logger,
  } = opts;

  // Use logger if provided, otherwise fallback to sink or default logger
  const finalLogger = logger || (sink ? null : defaultLogger);

  // Universal decorator that works with both general applications and NestJS
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | undefined => {
    // Handle case where descriptor is undefined (2-argument decorator)
    if (!descriptor) {
      return;
    }

    // Only modify function descriptors
    if (descriptor.value && typeof descriptor.value === 'function') {
      const original = descriptor.value;

      // Create a new descriptor that preserves all metadata for frameworks like NestJS
      const newDescriptor: PropertyDescriptor = {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        writable: descriptor.writable,
        value: function (...args: unknown[]) {
          if (sampleRate < 1 && getSecureRandom() > sampleRate) {
            return original.apply(this, args);
          }

          const className = (this as { constructor?: { name?: string } })?.constructor?.name;
          const methodName = String(propertyKey);
          const cid = getCorrelationId?.();

          const startTime = performance.now();
          const makeBase = (endTime: number) => {
            const timestamp = new Date().toISOString();
            return {
              timestamp: timestamp,
              level,
              scope: { className, methodName },
              correlationId: cid,
              durationMs: endTime - startTime,
            } as Omit<LogEntry, 'outcome'>;
          };

          // Helper function to log using either logger or sink
          const logEntry = (entry: LogEntry) => {
            if (finalLogger) {
              // Use the new logger interface
              const message = `${className}.${methodName} ${entry.outcome} in ${entry.durationMs.toFixed(1)}ms`;
              const meta: any = {
                scope: entry.scope,
                outcome: entry.outcome,
                durationMs: entry.durationMs,
                correlationId: entry.correlationId,
              };

              if (entry.args) meta.args = entry.args;
              if (entry.result) meta.result = entry.result;
              if (entry.error) meta.error = entry.error;

              finalLogger[level](message, meta);
            } else if (sink) {
              // Fallback to the old sink interface
              sink(entry);
            }
          };

          try {
            const ret = original.apply(this, args);

            if (isPromise(ret)) {
              return ret
                .then((value) => {
                  const endTime = performance.now();
                  const entry: LogEntry = {
                    ...makeBase(endTime),
                    outcome: 'success',
                    ...(includeArgs && { args: redact(args) as unknown[] }),
                    ...(includeResult && { result: redact(value) }),
                  };
                  logEntry(entry);
                  return value;
                })
                .catch((err) => {
                  const endTime = performance.now();
                  const entry: LogEntry = {
                    ...makeBase(endTime),
                    outcome: 'failure',
                    ...(includeArgs && { args: redact(args) as unknown[] }),
                    error: {
                      name: (err as Error)?.name ?? 'Error',
                      message: String((err as Error)?.message ?? err),
                      ...((err as Error)?.stack && {
                        stack: (err as Error).stack,
                      }),
                    },
                  };
                  logEntry(entry);
                  throw err;
                });
            }

            const endTime = performance.now();
            const entry: LogEntry = {
              ...makeBase(endTime),
              outcome: 'success',
              ...(includeArgs && { args: redact(args) as unknown[] }),
              ...(includeResult && { result: redact(ret) }),
            };
            logEntry(entry);
            return ret;
          } catch (err: unknown) {
            const endTime = performance.now();
            const entry: LogEntry = {
              ...makeBase(endTime),
              outcome: 'failure',
              ...(includeArgs && { args: redact(args) as unknown[] }),
              error: {
                name: (err as Error)?.name ?? 'Error',
                message: String((err as Error)?.message ?? err),
                ...((err as Error)?.stack && { stack: (err as Error).stack }),
              },
            };
            logEntry(entry);
            throw err;
          }
        },
      };

      // Preserve all existing metadata and return the enhanced descriptor
      return preserveMetadata(target, propertyKey, newDescriptor);
    }

    return descriptor;
  };
}
