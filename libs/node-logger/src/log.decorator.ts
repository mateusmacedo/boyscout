import { randomBytes } from 'node:crypto';
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

const defaultSink = (e: LogEntry) => {
  console.log('[LOG]', JSON.stringify(e));
};

export function Log(opts: LogOptions = {}): MethodDecorator {
  const {
    level = 'info',
    includeArgs = true,
    includeResult = false,
    sampleRate = 1,
    redact = defaultRedactor,
    sink = defaultSink,
    getCorrelationId,
  } = opts;

  return (_target, propertyKey, descriptor) => {
    // Only modify function descriptors
    if (descriptor.value && typeof descriptor.value === 'function') {
      const original = descriptor.value;
      (descriptor as { value: (...args: unknown[]) => unknown }).value = function (
        ...args: unknown[]
      ) {
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
            ts: timestamp,
            level,
            scope: { className, methodName },
            correlationId: cid,
            durationMs: endTime - startTime,
            timestamp,
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
      };
    }

    return descriptor;
  };
}
