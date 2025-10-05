export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: { className?: string; methodName: string };
  outcome: 'success' | 'failure';
  args?: unknown[];
  result?: unknown;
  error?: { name: string; message: string; stack?: string };
  correlationId?: string;
  durationMs: number;
}

export interface LogOptions {
  level?: LogLevel;
  includeArgs?: boolean;
  includeResult?: boolean;
  sampleRate?: number;
  redact?: (argsOrResult: unknown) => unknown;
  sink?: (entry: LogEntry) => void;
  getCorrelationId?: () => string | undefined;
  // New logger option for better abstraction
  logger?: import('./logger/logger.interface.js').Logger;
}
