import { getCid } from '../../src/context';
import { CorrelationIdMiddleware } from '../../src/express/correlation-id.middleware';

describe('Express Middleware + Context Integration', () => {
  let middleware: CorrelationIdMiddleware;
  let mockReq: { headers: Record<string, string | string[] | undefined> };
  let mockRes: { setHeader: jest.Mock };
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Integration', () => {
    it('should establish correlation ID context when valid header is provided', () => {
      const validCid = 'valid-correlation-id-123';
      mockReq.headers['x-correlation-id'] = validCid;

      let contextCid: string | undefined;

      middleware.use(mockReq, mockRes, () => {
        // Verify if context was established
        contextCid = getCid();
        mockNext();
      });

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', validCid);
      expect(contextCid).toBe(validCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should establish correlation ID context with generated ID when header is missing', () => {
      let contextCid: string | undefined;

      middleware.use(mockReq, mockRes, () => {
        // Verify if context was established with generated ID
        contextCid = getCid();
        mockNext();
      });

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(contextCid).toBeDefined();
      expect(contextCid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should establish correlation ID context with generated ID when header is empty', () => {
      mockReq.headers['x-correlation-id'] = '';

      let contextCid: string | undefined;

      middleware.use(mockReq, mockRes, () => {
        // Verify if context was established with generated ID
        contextCid = getCid();
        mockNext();
      });

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(contextCid).toBeDefined();
      expect(contextCid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should isolate context between different requests', () => {
      const cid1 = 'request-1-id';
      const cid2 = 'request-2-id';

      let contextCid1: string | undefined;
      let contextCid2: string | undefined;

      // First request
      mockReq.headers['x-correlation-id'] = cid1;
      middleware.use(mockReq, mockRes, () => {
        contextCid1 = getCid();
        mockNext();
      });

      // Second request
      mockReq.headers['x-correlation-id'] = cid2;
      middleware.use(mockReq, mockRes, () => {
        contextCid2 = getCid();
        mockNext();
      });

      expect(contextCid1).toBe(cid1);
      expect(contextCid2).toBe(cid2);
      expect(contextCid1).not.toBe(contextCid2);
    });

    it('should not leak context outside middleware execution', () => {
      const validCid = 'leak-test-id';
      mockReq.headers['x-correlation-id'] = validCid;

      // Verify there is no context before
      expect(getCid()).toBeUndefined();

      middleware.use(mockReq, mockRes, () => {
        // Verify there is context during execution
        expect(getCid()).toBe(validCid);
        mockNext();
      });

      // Verify there is no context after
      expect(getCid()).toBeUndefined();
    });

    it('should handle context isolation with async operations', async () => {
      const validCid = 'async-context-id';
      mockReq.headers['x-correlation-id'] = validCid;

      let asyncContextCid: string | undefined;

      middleware.use(mockReq, mockRes, async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        asyncContextCid = getCid();
        mockNext();
      });

      // Wait for async operation completion
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(asyncContextCid).toBe(validCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple middleware calls with different contexts', () => {
      const cid1 = 'multi-1-id';
      const cid2 = 'multi-2-id';

      let contextCid1: string | undefined;
      let contextCid2: string | undefined;

      // First middleware call
      mockReq.headers['x-correlation-id'] = cid1;
      middleware.use(mockReq, mockRes, () => {
        contextCid1 = getCid();
        mockNext();
      });

      // Second middleware call
      mockReq.headers['x-correlation-id'] = cid2;
      middleware.use(mockReq, mockRes, () => {
        contextCid2 = getCid();
        mockNext();
      });

      expect(contextCid1).toBe(cid1);
      expect(contextCid2).toBe(cid2);
      expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling in Context', () => {
    it('should maintain context when next() throws an error', () => {
      const validCid = 'error-context-id';
      mockReq.headers['x-correlation-id'] = validCid;

      let contextCid: string | undefined;

      expect(() => {
        middleware.use(mockReq, mockRes, () => {
          contextCid = getCid();
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      expect(contextCid).toBe(validCid);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', validCid);
    });

    it('should not leak context after error in next()', () => {
      const validCid = 'error-leak-id';
      mockReq.headers['x-correlation-id'] = validCid;

      expect(getCid()).toBeUndefined();

      expect(() => {
        middleware.use(mockReq, mockRes, () => {
          expect(getCid()).toBe(validCid);
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      expect(getCid()).toBeUndefined();
    });
  });
});
