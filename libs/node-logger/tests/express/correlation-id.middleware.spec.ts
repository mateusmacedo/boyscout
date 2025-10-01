import { getCid } from '../../src/context';
import { CorrelationIdMiddleware } from '../../src/express/correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
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

  describe('use', () => {
    it('should set correlation ID header when valid x-correlation-id is provided', () => {
      const validCid = 'valid-correlation-id-123';
      mockReq.headers['x-correlation-id'] = validCid;

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', validCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is not provided', () => {
      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is empty string', () => {
      mockReq.headers['x-correlation-id'] = '';

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is only whitespace', () => {
      mockReq.headers['x-correlation-id'] = '   ';

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is undefined', () => {
      mockReq.headers['x-correlation-id'] = undefined;

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id is an array', () => {
      const validCid = 'valid-correlation-id-456';
      mockReq.headers['x-correlation-id'] = [validCid, 'another-cid'];

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id array contains empty string', () => {
      mockReq.headers['x-correlation-id'] = ['', 'another-cid'];

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id array contains only whitespace', () => {
      mockReq.headers['x-correlation-id'] = ['   ', 'another-cid'];

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should generate new correlation ID when x-correlation-id array is empty', () => {
      mockReq.headers['x-correlation-id'] = [];

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should run next function within reqStore context', () => {
      const validCid = 'test-context-cid';
      mockReq.headers['x-correlation-id'] = validCid;

      let contextCid: string | undefined;

      middleware.use(mockReq, mockRes, () => {
        contextCid = getCid();
        mockNext();
      });

      expect(contextCid).toBe(validCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should run next function within reqStore context with generated CID', () => {
      let contextCid: string | undefined;

      middleware.use(mockReq, mockRes, () => {
        contextCid = getCid();
        mockNext();
      });

      expect(contextCid).toBeDefined();
      expect(contextCid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not have context available after middleware execution', () => {
      middleware.use(mockReq, mockRes, mockNext);

      const contextAfterExecution = getCid();
      expect(contextAfterExecution).toBeUndefined();
    });

    it('should handle case-sensitive header names', () => {
      const validCid = 'case-sensitive-test';
      mockReq.headers['X-Correlation-ID'] = validCid;

      middleware.use(mockReq, mockRes, mockNext);

      // Should not find the header due to case sensitivity
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRes.setHeader.mock.calls[0][1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should preserve correlation ID with leading/trailing whitespace', () => {
      const cidWithWhitespace = '  cid-with-whitespace  ';
      mockReq.headers['x-correlation-id'] = cidWithWhitespace;

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', cidWithWhitespace);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in correlation ID', () => {
      const specialCid = 'cid-with-special-chars-!@#$%^&*()';
      mockReq.headers['x-correlation-id'] = specialCid;

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', specialCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle very long correlation IDs', () => {
      const longCid = 'a'.repeat(1000);
      mockReq.headers['x-correlation-id'] = longCid;

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', longCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle unicode characters in correlation ID', () => {
      const unicodeCid = 'cid-with-unicode-🚀-🎉-中文';
      mockReq.headers['x-correlation-id'] = unicodeCid;

      middleware.use(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', unicodeCid);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('middleware instantiation', () => {
    it('should be instantiable', () => {
      expect(middleware).toBeInstanceOf(CorrelationIdMiddleware);
    });

    it('should implement NestMiddleware interface', () => {
      expect(typeof middleware.use).toBe('function');
    });
  });
});
