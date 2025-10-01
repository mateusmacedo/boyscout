import { getCid } from '../../src/context';
import { correlationIdPlugin } from '../../src/fastify/correlation-id.plugin';

describe('correlationIdPlugin', () => {
  let mockFastify: {
    addHook: jest.Mock;
  };
  let mockOpts: unknown;
  let mockDone: jest.Mock;
  let mockHookHandler: (
    req: { headers: Record<string, string | string[] | undefined> },
    reply: { header: jest.Mock },
    hookDone: jest.Mock
  ) => void;

  beforeEach(() => {
    mockFastify = {
      addHook: jest.fn(),
    };
    mockOpts = {};
    mockDone = jest.fn();

    // Capture the hook handler when addHook is called
    mockFastify.addHook.mockImplementation((event, handler) => {
      if (event === 'onRequest') {
        mockHookHandler = handler;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('plugin registration', () => {
    it('should register onRequest hook', () => {
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it('should call done callback after registration', () => {
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      expect(mockDone).toHaveBeenCalledTimes(1);
    });
  });

  describe('onRequest hook handler', () => {
    let mockReq: { headers: Record<string, string | string[] | undefined> };
    let mockReply: { header: jest.Mock };
    let mockHookDone: jest.Mock;

    beforeEach(() => {
      // Register the plugin to get the hook handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      mockReq = {
        headers: {},
      };
      mockReply = {
        header: jest.fn(),
      };
      mockHookDone = jest.fn();
    });

    it('should set correlation ID header when valid x-correlation-id is provided', () => {
      const validCid = 'valid-correlation-id-123';
      mockReq.headers['x-correlation-id'] = validCid;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', validCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is not provided', () => {
      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is empty string', () => {
      mockReq.headers['x-correlation-id'] = '';

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is only whitespace', () => {
      mockReq.headers['x-correlation-id'] = '   ';

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is undefined', () => {
      mockReq.headers['x-correlation-id'] = undefined;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is an array', () => {
      const validCid = 'valid-correlation-id-456';
      mockReq.headers['x-correlation-id'] = [validCid, 'another-cid'];

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id array contains empty string', () => {
      mockReq.headers['x-correlation-id'] = ['', 'another-cid'];

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id array contains only whitespace', () => {
      mockReq.headers['x-correlation-id'] = ['   ', 'another-cid'];

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id array is empty', () => {
      mockReq.headers['x-correlation-id'] = [];

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should run hookDone function within reqStore context', () => {
      const validCid = 'test-context-cid';
      mockReq.headers['x-correlation-id'] = validCid;

      let contextCid: string | undefined;

      mockHookHandler(mockReq, mockReply, () => {
        contextCid = getCid();
        mockHookDone();
      });

      expect(contextCid).toBe(validCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should run hookDone function within reqStore context with generated CID', () => {
      let contextCid: string | undefined;

      mockHookHandler(mockReq, mockReply, () => {
        contextCid = getCid();
        mockHookDone();
      });

      expect(contextCid).toBeDefined();
      expect(contextCid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should not have context available after hook execution', () => {
      mockHookHandler(mockReq, mockReply, mockHookDone);

      const contextAfterExecution = getCid();
      expect(contextAfterExecution).toBeUndefined();
    });

    it('should handle case-sensitive header names', () => {
      const validCid = 'case-sensitive-test';
      mockReq.headers['X-Correlation-ID'] = validCid;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      // Should not find the header due to case sensitivity
      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockReply.header.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should preserve correlation ID with leading/trailing whitespace', () => {
      const cidWithWhitespace = '  cid-with-whitespace  ';
      mockReq.headers['x-correlation-id'] = cidWithWhitespace;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', cidWithWhitespace);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in correlation ID', () => {
      const specialCid = 'cid-with-special-chars-!@#$%^&*()';
      mockReq.headers['x-correlation-id'] = specialCid;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', specialCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should handle very long correlation IDs', () => {
      const longCid = 'a'.repeat(1000);
      mockReq.headers['x-correlation-id'] = longCid;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', longCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should handle unicode characters in correlation ID', () => {
      const unicodeCid = 'cid-with-unicode-🚀-🎉-中文';
      mockReq.headers['x-correlation-id'] = unicodeCid;

      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', unicodeCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple requests with different correlation IDs', () => {
      const cid1 = 'first-request-cid';
      const cid2 = 'second-request-cid';

      // First request
      mockReq.headers['x-correlation-id'] = cid1;
      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', cid1);
      expect(mockHookDone).toHaveBeenCalledTimes(1);

      // Reset mocks for second request
      mockReply.header.mockClear();
      mockHookDone.mockClear();

      // Second request
      mockReq.headers['x-correlation-id'] = cid2;
      mockHookHandler(mockReq, mockReply, mockHookDone);

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', cid2);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests with different correlation IDs', () => {
      const cid1 = 'concurrent-cid-1';
      const cid2 = 'concurrent-cid-2';

      let contextCid1: string | undefined;
      let contextCid2: string | undefined;

      // Simulate concurrent requests
      mockReq.headers['x-correlation-id'] = cid1;
      mockHookHandler(mockReq, mockReply, () => {
        contextCid1 = getCid();
        mockHookDone();
      });

      // Reset for second request
      mockReply.header.mockClear();
      mockHookDone.mockClear();

      mockReq.headers['x-correlation-id'] = cid2;
      mockHookHandler(mockReq, mockReply, () => {
        contextCid2 = getCid();
        mockHookDone();
      });

      expect(contextCid1).toBe(cid1);
      expect(contextCid2).toBe(cid2);
      expect(contextCid1).not.toBe(contextCid2);
    });
  });

  describe('plugin function signature', () => {
    it('should be a function', () => {
      expect(typeof correlationIdPlugin).toBe('function');
    });

    it('should accept fastify, opts, and done parameters', () => {
      expect(correlationIdPlugin.length).toBe(3);
    });

    it('should handle different types of opts parameter', () => {
      const testOpts = { testOption: 'value' };

      expect(() => {
        correlationIdPlugin(mockFastify, testOpts, mockDone);
      }).not.toThrow();

      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it('should handle null opts parameter', () => {
      expect(() => {
        correlationIdPlugin(mockFastify, null, mockDone);
      }).not.toThrow();

      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined opts parameter', () => {
      expect(() => {
        correlationIdPlugin(mockFastify, undefined, mockDone);
      }).not.toThrow();

      expect(mockDone).toHaveBeenCalledTimes(1);
    });
  });
});
