import { Log } from '@boyscout/node-logger';
import { Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

/**
 * Teste para validar compatibilidade de injeção de dependência
 * com decorators do @boyscout/node-logger
 */
describe('Dependency Injection Compatibility', () => {
  let module: TestingModule;

  @Injectable()
  class TestService {
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    processData(data: Record<string, unknown>) {
      return { processed: true, data };
    }

    @Log({ level: 'debug', includeArgs: false, includeResult: true })
    getServiceInfo() {
      return { name: 'TestService', version: '1.0.0' };
    }
  }

  @Injectable()
  class DependentService {
    constructor(private readonly testService: TestService) {}

    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async processWithDependency(input: Record<string, unknown>) {
      const result = await this.testService.processData(input);
      return { ...result, dependencyProcessed: true };
    }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [TestService, DependentService],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should inject dependencies correctly with @Log decorator', () => {
    const testService = module.get<TestService>(TestService);
    const dependentService = module.get<DependentService>(DependentService);

    expect(testService).toBeDefined();
    expect(dependentService).toBeDefined();
    expect(dependentService.testService).toBe(testService);
  });

  it('should preserve method metadata for dependency injection', () => {
    const testService = module.get<TestService>(TestService);
    const dependentService = module.get<DependentService>(DependentService);

    // Verifica se os métodos existem e são funções
    expect(typeof testService.processData).toBe('function');
    expect(typeof testService.getServiceInfo).toBe('function');
    expect(typeof dependentService.processWithDependency).toBe('function');
  });

  it('should execute methods with @Log decorator without errors', async () => {
    const testService = module.get<TestService>(TestService);
    const dependentService = module.get<DependentService>(DependentService);

    // Teste do serviço base
    const result1 = await testService.processData({ test: 'data' });
    expect(result1).toEqual({ processed: true, data: { test: 'data' } });

    const result2 = testService.getServiceInfo();
    expect(result2).toEqual({ name: 'TestService', version: '1.0.0' });

    // Teste do serviço com dependência
    const result3 = await dependentService.processWithDependency({ input: 'test' });
    expect(result3).toEqual({
      processed: true,
      data: { input: 'test' },
      dependencyProcessed: true,
    });
  });

  it('should work with simple services without dependencies', async () => {
    @Injectable()
    class SimpleService {
      @Log({ level: 'info', includeArgs: true, includeResult: true })
      simpleMethod() {
        return { simple: true, timestamp: new Date().toISOString() };
      }
    }

    const testModule = await Test.createTestingModule({
      providers: [SimpleService],
    }).compile();

    const service = testModule.get<SimpleService>(SimpleService);

    expect(service).toBeDefined();

    const result = await service.simpleMethod();
    expect(result.simple).toBe(true);
    expect(result.timestamp).toBeDefined();

    await testModule.close();
  });
});
