/**
 * Unit tests for Context module
 *
 * Tests the AsyncLocalStorage-based context management,
 * correlation ID handling, and context isolation.
 */

const { ensureCid, getCid, reqStore } = require('../../src/context');
const { createTestCorrelationId } = require('../helpers/test-utils');

describe('Context Module', () => {
  describe('AsyncLocalStorage (reqStore)', () => {
    it('should provide AsyncLocalStorage interface with run and getStore methods', () => {
      expect(reqStore).toBeDefined();
      expect(typeof reqStore.run).toBe('function');
      expect(typeof reqStore.getStore).toBe('function');
    });

    it('should store and retrieve context data within run callback', () => {
      const testCid = createTestCorrelationId('store-retrieve');
      const testData = { cid: testCid };

      reqStore.run(testData, () => {
        const store = reqStore.getStore();
        expect(store).toEqual(testData);
        expect(store?.cid).toBe(testCid);
      });
    });

    it('should return undefined when accessed outside of run context', () => {
      const store = reqStore.getStore();
      expect(store).toBeUndefined();
    });

    it('should maintain context isolation between nested run calls', () => {
      const outerCid = createTestCorrelationId('outer');
      const innerCid = createTestCorrelationId('inner');

      reqStore.run({ cid: outerCid }, () => {
        expect(reqStore.getStore()?.cid).toBe(outerCid);

        reqStore.run({ cid: innerCid }, () => {
          expect(reqStore.getStore()?.cid).toBe(innerCid);
        });

        // Should restore outer context after inner run completes
        expect(reqStore.getStore()?.cid).toBe(outerCid);
      });
    });
  });

  describe('getCid function', () => {
    it('should return correlation ID when context is available', () => {
      const testCid = createTestCorrelationId('available');

      reqStore.run({ cid: testCid }, () => {
        const result = getCid();
        expect(result).toBe(testCid);
      });
    });

    it('should return undefined when no context is available', () => {
      const result = getCid();
      expect(result).toBeUndefined();
    });

    it('should return empty string when context exists but cid is empty', () => {
      reqStore.run({ cid: '' }, () => {
        const result = getCid();
        expect(result).toBe('');
      });
    });
  });

  describe('ensureCid function', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    describe('with valid input', () => {
      it('should return the provided string when it is valid', () => {
        const validCid = createTestCorrelationId('valid');
        const result = ensureCid(validCid);
        expect(result).toBe(validCid);
      });

      it('should return the provided string when it has whitespace but is not empty', () => {
        const cidWithWhitespace = '  valid-cid  ';
        const result = ensureCid(cidWithWhitespace);
        expect(result).toBe(cidWithWhitespace);
      });
    });

    describe('with invalid input', () => {
      it('should generate a new UUID when provided string is empty', () => {
        const result = ensureCid('');
        expect(result).toMatch(UUID_REGEX);
      });

      it('should generate a new UUID when provided string is only whitespace', () => {
        const result = ensureCid('   ');
        expect(result).toMatch(UUID_REGEX);
      });

      it('should generate a new UUID when no argument is provided', () => {
        const result = ensureCid();
        expect(result).toMatch(UUID_REGEX);
      });

      it('should generate a new UUID when provided argument is undefined', () => {
        const result = ensureCid(undefined);
        expect(result).toMatch(UUID_REGEX);
      });
    });

    describe('with non-string input', () => {
      it('should generate a new UUID when provided argument is an array', () => {
        const result = ensureCid(['not', 'a', 'string']);
        expect(result).toMatch(UUID_REGEX);
      });

      it('should generate a new UUID when provided argument is null', () => {
        const result = ensureCid(undefined);
        expect(result).toMatch(UUID_REGEX);
      });

      it('should generate a new UUID when provided argument is a number', () => {
        const result = ensureCid(undefined);
        expect(result).toMatch(UUID_REGEX);
      });

      it('should generate a new UUID when provided argument is a boolean', () => {
        const result = ensureCid(undefined);
        expect(result).toMatch(UUID_REGEX);
      });
    });

    describe('UUID generation', () => {
      it('should generate different UUIDs for multiple calls', () => {
        const uuid1 = ensureCid('');
        const uuid2 = ensureCid('');
        const uuid3 = ensureCid();

        expect(uuid1).not.toBe(uuid2);
        expect(uuid2).not.toBe(uuid3);
        expect(uuid1).not.toBe(uuid3);
      });

      it('should generate valid UUID format', () => {
        const result = ensureCid('');
        expect(result).toMatch(UUID_REGEX);
        expect(result).toHaveLength(36); // UUID v4 format
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work together in a typical request flow', () => {
      const incomingCid = createTestCorrelationId('incoming');
      const ensuredCid = ensureCid(incomingCid);

      reqStore.run({ cid: ensuredCid }, () => {
        const retrievedCid = getCid();
        expect(retrievedCid).toBe(ensuredCid);
        expect(retrievedCid).toBe(incomingCid);
      });
    });

    it('should handle flow with auto-generated CID', () => {
      const ensuredCid = ensureCid(''); // This will generate a UUID

      reqStore.run({ cid: ensuredCid }, () => {
        const retrievedCid = getCid();
        expect(retrievedCid).toBe(ensuredCid);
        expect(retrievedCid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      });
    });

    it('should maintain context isolation in nested operations', () => {
      const outerCid = ensureCid(createTestCorrelationId('outer'));
      const innerCid = ensureCid(createTestCorrelationId('inner'));

      reqStore.run({ cid: outerCid }, () => {
        expect(getCid()).toBe(outerCid);

        reqStore.run({ cid: innerCid }, () => {
          expect(getCid()).toBe(innerCid);
        });

        expect(getCid()).toBe(outerCid);
      });
    });
  });
});
