import { randomBytes } from 'node:crypto';
import { getCid } from './context.js';
import { createPinoSink } from './pino-sink.js';
import { createRedactor } from './redact.js';
import type { LogEntry, LogOptions } from './types.js';

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

// Create default Pino sink with sensible defaults
const defaultSink = createPinoSink({
  service: process.env.SERVICE_NAME || 'node-logger',
  env: process.env.NODE_ENV || 'development',
  version: process.env.SERVICE_VERSION || '1.0.0',
  enableBackpressure: true,
  bufferSize: 1000,
  flushInterval: 5000,
});

export function Log(opts: LogOptions = {}) {
  const {
    level = 'info',
    includeArgs = true,
    includeResult = false,
    sampleRate = 1,
    redact = defaultRedactor,
    sink = defaultSink,
    getCorrelationId = getCid,
  } = opts;

  // Universal decorator that works with both general applications and NestJS
  return (
    _target: unknown,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor
  ): PropertyDescriptor | undefined => {
    // Handle case where descriptor is undefined (2-argument decorator)
    if (!descriptor) {
      return;
    }

    // Only modify function descriptors
    if (descriptor.value && typeof descriptor.value === 'function') {
      const original = descriptor.value;

      // Create a new descriptor that preserves metadata for frameworks like NestJS
      const newDescriptor: PropertyDescriptor = {
        ...descriptor,
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
                  sink(entry);
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
                      ...((err as Error)?.stack && { stack: (err as Error).stack }),
                    },
                  };
                  sink(entry);
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
            sink(entry);
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
            sink(entry);
            throw err;
          }
        },
      };

      return newDescriptor;
    }

    return descriptor;
  };
}
