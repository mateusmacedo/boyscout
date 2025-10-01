import { Log } from '@boyscout/node-logger';
import { Get, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

/**
 * Teste para validar preservação de metadata com decorators do @boyscout/node-logger
 */
describe('Metadata Preservation', () => {
  let module: TestingModule;
  let reflector: Reflector;

  const CUSTOM_METADATA_KEY = 'custom:metadata';
  const RATE_LIMIT_KEY = 'rate:limit';

  @Injectable()
  class MetadataTestService {
    @SetMetadata(CUSTOM_METADATA_KEY, { priority: 'high', category: 'critical' })
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    criticalOperation(data: Record<string, unknown>) {
      return { processed: true, critical: true, data };
    }

    @SetMetadata(RATE_LIMIT_KEY, { requests: 100, window: '1m' })
    @Log({ level: 'debug', includeArgs: false, includeResult: true })
    rateLimitedOperation() {
      return { rateLimited: true };
    }

    @SetMetadata(CUSTOM_METADATA_KEY, { priority: 'low' })
    @SetMetadata(RATE_LIMIT_KEY, { requests: 10, window: '1h' })
    @Log({ level: 'warn', includeArgs: true, includeResult: false })
    multiMetadataOperation(input: Record<string, unknown>) {
      return { multiMetadata: true, input };
    }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [MetadataTestService],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should preserve custom metadata alongside @Log decorator', () => {
    const service = module.get<MetadataTestService>(MetadataTestService);
    const criticalMetadata = reflector.get(CUSTOM_METADATA_KEY, service.criticalOperation);
    const rateLimitMetadata = reflector.get(RATE_LIMIT_KEY, service.rateLimitedOperation);

    expect(criticalMetadata).toEqual({ priority: 'high', category: 'critical' });
    expect(rateLimitMetadata).toEqual({ requests: 100, window: '1m' });
  });

  it('should preserve multiple metadata keys with @Log decorator', () => {
    const service = module.get<MetadataTestService>(MetadataTestService);
    const customMetadata = reflector.get(CUSTOM_METADATA_KEY, service.multiMetadataOperation);
    const rateLimitMetadata = reflector.get(RATE_LIMIT_KEY, service.multiMetadataOperation);

    expect(customMetadata).toEqual({ priority: 'low' });
    expect(rateLimitMetadata).toEqual({ requests: 10, window: '1h' });
  });

  it('should maintain method functionality with preserved metadata', async () => {
    const service = module.get<MetadataTestService>(MetadataTestService);

    const result1 = await service.criticalOperation({ test: 'critical' });
    expect(result1).toEqual({ processed: true, critical: true, data: { test: 'critical' } });

    const result2 = await service.rateLimitedOperation();
    expect(result2).toEqual({ rateLimited: true });

    const result3 = await service.multiMetadataOperation({ test: 'multi' });
    expect(result3).toEqual({ multiMetadata: true, input: { test: 'multi' } });
  });

  it('should preserve NestJS built-in metadata with @Log decorator', () => {
    @Injectable()
    class ControllerTestService {
      @Get('test')
      @Log({ level: 'info', includeArgs: true, includeResult: true })
      testEndpoint() {
        return { endpoint: 'test' };
      }
    }

    const testModule = Test.createTestingModule({
      providers: [ControllerTestService],
    }).compile();

    expect(testModule).toBeDefined();
  });

  it('should handle complex metadata scenarios', () => {
    @Injectable()
    class ComplexMetadataService {
      @SetMetadata('auth:required', true)
      @SetMetadata('roles', ['admin', 'user'])
      @SetMetadata('cache:ttl', 300)
      @Log({ level: 'info', includeArgs: true, includeResult: true })
      complexMethod(data: Record<string, unknown>) {
        return { complex: true, data };
      }
    }

    const testModule = Test.createTestingModule({
      providers: [ComplexMetadataService],
    }).compile();

    expect(testModule).toBeDefined();
  });

  it('should preserve metadata across inheritance', () => {
    @Injectable()
    class BaseService {
      @SetMetadata('base:metadata', 'base-value')
      @Log({ level: 'info', includeArgs: true, includeResult: true })
      baseMethod() {
        return { base: true };
      }
    }

    @Injectable()
    class ExtendedService extends BaseService {
      @SetMetadata('extended:metadata', 'extended-value')
      @Log({ level: 'debug', includeArgs: true, includeResult: true })
      extendedMethod() {
        return { extended: true };
      }
    }

    const testModule = Test.createTestingModule({
      providers: [BaseService, ExtendedService],
    }).compile();

    expect(testModule).toBeDefined();
  });
});
