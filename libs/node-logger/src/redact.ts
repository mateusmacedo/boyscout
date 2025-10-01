export interface RedactorOptions {
  keys?: (string | RegExp)[];
  patterns?: RegExp[];
  mask?: string | ((value: unknown, path: string[]) => string);
  maxDepth?: number;
  keepLengths?: boolean;
  redactArrayIndices?: boolean; // New option to redact array indices
}

export function createRedactor(opts: RedactorOptions = {}) {
  const {
    keys = [
      'password',
      'passwd',
      'pass',
      'pwd',
      'token',
      'access_token',
      'refresh_token',
      'authorization',
      'auth',
      'secret',
      'apiKey',
      'api_key',
      'apikey',
      'client_secret',
      'card',
      'cardNumber',
      'cvv',
      'cvc',
      'ssn',
      'cpf',
      'cnpj',
    ],
    patterns = [
      /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi,
      /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/gi,
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
      /\b(?:[A-Fa-f0-9]{32,64})\b/g,
    ],
    mask = '***',
    maxDepth = 5,
    keepLengths = false,
    redactArrayIndices = true, // By default, redact array indices
  } = opts;

  const keyMatchers = keys.map((k) => (typeof k === 'string' ? new RegExp(`^${k}$`, 'i') : k));

  const maskValue = (v: unknown, path: string[]) => {
    if (typeof mask === 'function') return mask(v, path);
    if (keepLengths && typeof v === 'string') return '*'.repeat(v.length);
    return mask;
  };

  const seen = new WeakSet();

  const redactString = (s: string, path: string[]) => {
    let out = s;
    for (const re of patterns) out = out.replace(re, () => maskValue(s, path));
    return out;
  };

  const isStreamLike = (value: unknown): boolean => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'pipe' in value &&
      'on' in value &&
      typeof (value as { pipe: unknown }).pipe === 'function' &&
      typeof (value as { on: unknown }).on === 'function'
    );
  };

  const handlePrimitive = (value: unknown, path: string[]): unknown => {
    if (value == null || typeof value !== 'object') {
      if (value === null) return null;
      return typeof value === 'string' ? redactString(value, path) : value;
    }
    return null; // Not a primitive
  };

  const handleSpecialObjects = (value: unknown): unknown => {
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return String(value);
    if (Buffer?.isBuffer?.(value)) return '[Buffer]';
    if (isStreamLike(value)) return '[Stream]';
    return null; // Not a special object
  };

  const handleCircularAndDepth = (value: unknown, depth: number): unknown => {
    if (value == null) return null; // Skip circular check for null/undefined
    if (seen.has(value as object)) return '[Circular]';
    if (depth >= maxDepth) return '[MaxDepth]';
    seen.add(value as object);
    return null; // Continue processing
  };

  const processArray = (value: unknown[], depth: number, path: string[]): unknown[] => {
    return value.map((v, i) => {
      const nextPath = [...path, String(i)];
      if (redactArrayIndices && keyMatchers.some((re) => re.test(String(i)))) {
        return maskValue(v, nextPath);
      }
      return walk(v, depth + 1, nextPath);
    });
  };

  const processMap = (
    value: Map<unknown, unknown>,
    depth: number,
    path: string[]
  ): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) {
      obj[String(k)] = walk(v, depth + 1, [...path, String(k)]);
    }
    return obj;
  };

  const processSet = (value: Set<unknown>, depth: number, path: string[]): unknown[] => {
    return Array.from(value).map((v, i) => walk(v, depth + 1, [...path, String(i)]));
  };

  const processError = (value: Error): Record<string, unknown> => {
    return { name: value.name, message: value.message, stack: value.stack };
  };

  const processObject = (
    value: Record<string, unknown>,
    depth: number,
    path: string[]
  ): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const nextPath = [...path, key];
      if (keyMatchers.some((re) => re.test(key))) {
        out[key] = maskValue(value[key], nextPath);
      } else {
        out[key] = walk(value[key], depth + 1, nextPath);
      }
    }
    return out;
  };

  function walk(value: unknown, depth: number, path: string[]): unknown {
    // Handle null/undefined first
    if (value == null) return value;

    // Handle primitives first
    const primitiveResult = handlePrimitive(value, path);
    if (primitiveResult !== null) return primitiveResult;

    // Handle special objects
    const specialResult = handleSpecialObjects(value);
    if (specialResult !== null) return specialResult;

    // Handle circular references and depth limits
    const circularResult = handleCircularAndDepth(value, depth);
    if (circularResult !== null) return circularResult;

    // Handle collections
    if (Array.isArray(value)) return processArray(value, depth, path);
    if (value instanceof Map) return processMap(value, depth, path);
    if (value instanceof Set) return processSet(value, depth, path);
    if (value instanceof Error) return processError(value);

    // Handle regular objects
    return processObject(value as Record<string, unknown>, depth, path);
  }

  return function redactor(input: unknown): unknown {
    try {
      return walk(input, 0, []);
    } catch {
      return '[Unredactable]';
    }
  };
}

export const composeRedactors =
  (...fns: Array<(v: unknown) => unknown>) =>
  (v: unknown) =>
    fns.reduce((acc, fn) => fn(acc), v);
