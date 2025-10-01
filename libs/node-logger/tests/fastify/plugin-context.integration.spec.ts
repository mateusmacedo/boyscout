import { getCid } from '../../src/context';
import { correlationIdPlugin } from '../../src/fastify/correlation-id.plugin';

describe('Fastify Plugin + Context Integration', () => {
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

  describe('Context Integration', () => {
    it('should establish correlation ID context when valid header is provided', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const validCid = 'valid-correlation-id-123';
      const mockReq = {
        headers: {
          'x-correlation-id': validCid,
        },
      };
      const mockReply = {
        header: jest.fn(),
      };
      const mockHookDone = jest.fn();

      let contextCid: string | undefined;

      // Simulate hook execution
      mockHookHandler(mockReq, mockReply, () => {
        // Verify if context was established
        contextCid = getCid();
        mockHookDone();
      });

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', validCid);
      expect(contextCid).toBe(validCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should establish correlation ID context with generated ID when header is missing', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const mockReq = {
        headers: {},
      };
      const mockReply = {
        header: jest.fn(),
      };
      const mockHookDone = jest.fn();

      let contextCid: string | undefined;

      // Simulate hook execution
      mockHookHandler(mockReq, mockReply, () => {
        // Verify if context was established with generated ID
        contextCid = getCid();
        mockHookDone();
      });

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(contextCid).toBeDefined();
      expect(contextCid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should establish correlation ID context with generated ID when header is empty', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const mockReq = {
        headers: {
          'x-correlation-id': '',
        },
      };
      const mockReply = {
        header: jest.fn(),
      };
      const mockHookDone = jest.fn();

      let contextCid: string | undefined;

      // Simulate hook execution
      mockHookHandler(mockReq, mockReply, () => {
        // Verify if context was established with generated ID
        contextCid = getCid();
        mockHookDone();
      });

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(contextCid).toBeDefined();
      expect(contextCid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should isolate context between different requests', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const cid1 = 'request-1-id';
      const cid2 = 'request-2-id';

      let contextCid1: string | undefined;
      let contextCid2: string | undefined;

      // First request
      const mockReq1 = {
        headers: {
          'x-correlation-id': cid1,
        },
      };
      const mockReply1 = {
        header: jest.fn(),
      };
      const mockHookDone1 = jest.fn();

      mockHookHandler(mockReq1, mockReply1, () => {
        contextCid1 = getCid();
        mockHookDone1();
      });

      // Second request
      const mockReq2 = {
        headers: {
          'x-correlation-id': cid2,
        },
      };
      const mockReply2 = {
        header: jest.fn(),
      };
      const mockHookDone2 = jest.fn();

      mockHookHandler(mockReq2, mockReply2, () => {
        contextCid2 = getCid();
        mockHookDone2();
      });

      expect(contextCid1).toBe(cid1);
      expect(contextCid2).toBe(cid2);
      expect(contextCid1).not.toBe(contextCid2);
    });

    it('should not leak context outside hook execution', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const validCid = 'leak-test-id';

      // Verify there is no context before
      expect(getCid()).toBeUndefined();

      const mockReq = {
        headers: {
          'x-correlation-id': validCid,
        },
      };
      const mockReply = {
        header: jest.fn(),
      };
      const mockHookDone = jest.fn();

      mockHookHandler(mockReq, mockReply, () => {
        // Verify there is context during execution
        expect(getCid()).toBe(validCid);
        mockHookDone();
      });

      // Verify there is no context after
      expect(getCid()).toBeUndefined();
    });

    it('should handle context isolation with async operations', async () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const validCid = 'async-context-id';
      const mockReq = {
        headers: {
          'x-correlation-id': validCid,
        },
      };
      const mockReply = {
        header: jest.fn(),
      };
      const mockHookDone = jest.fn();

      let asyncContextCid: string | undefined;

      // Simulate hook execution with async operation
      mockHookHandler(mockReq, mockReply, async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        asyncContextCid = getCid();
        mockHookDone();
      });

      // Wait for async operation completion
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(asyncContextCid).toBe(validCid);
      expect(mockHookDone).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple hook calls with different contexts', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const cid1 = 'multi-1-id';
      const cid2 = 'multi-2-id';

      let contextCid1: string | undefined;
      let contextCid2: string | undefined;

      // First hook call
      const mockReq1 = {
        headers: {
          'x-correlation-id': cid1,
        },
      };
      const mockReply1 = {
        header: jest.fn(),
      };
      const mockHookDone1 = jest.fn();

      mockHookHandler(mockReq1, mockReply1, () => {
        contextCid1 = getCid();
        mockHookDone1();
      });

      // Second hook call
      const mockReq2 = {
        headers: {
          'x-correlation-id': cid2,
        },
      };
      const mockReply2 = {
        header: jest.fn(),
      };
      const mockHookDone2 = jest.fn();

      mockHookHandler(mockReq2, mockReply2, () => {
        contextCid2 = getCid();
        mockHookDone2();
      });

      expect(contextCid1).toBe(cid1);
      expect(contextCid2).toBe(cid2);
      expect(mockReply1.header).toHaveBeenCalledTimes(1);
      expect(mockReply2.header).toHaveBeenCalledTimes(1);
      expect(mockHookDone1).toHaveBeenCalledTimes(1);
      expect(mockHookDone2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling in Context', () => {
    it('should maintain context when hookDone() throws an error', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const validCid = 'error-context-id';
      const mockReq = {
        headers: {
          'x-correlation-id': validCid,
        },
      };
      const mockReply = {
        header: jest.fn(),
      };

      let contextCid: string | undefined;

      expect(() => {
        mockHookHandler(mockReq, mockReply, () => {
          contextCid = getCid();
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      expect(contextCid).toBe(validCid);
      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', validCid);
    });

    it('should not leak context after error in hookDone()', () => {
      // Register plugin to get handler
      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      const validCid = 'error-leak-id';

      // Verify there is no context before
      expect(getCid()).toBeUndefined();

      const mockReq = {
        headers: {
          'x-correlation-id': validCid,
        },
      };
      const mockReply = {
        header: jest.fn(),
      };

      expect(() => {
        mockHookHandler(mockReq, mockReply, () => {
          expect(getCid()).toBe(validCid);
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      // Verify there is no context after
      expect(getCid()).toBeUndefined();
    });
  });
});
