import { Log } from '../../src/log.decorator.js';
import { cleanupAllSinks } from '../../src/pino-sink.js';

describe('Memory Leak Fix Tests', () => {
  let initialListenerCount: number;

  beforeAll(() => {
    // Get initial listener count for process events
    initialListenerCount = process.listenerCount('beforeExit');
  });

  afterAll(() => {
    // Clean up all logger sinks to prevent memory leaks
    cleanupAllSinks();

    // Clean up any listeners added during tests
    process.removeAllListeners('beforeExit');
    process.removeAllListeners('exit');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGQUIT');
  });

  it('should not create multiple event listeners when using multiple @Log decorators', () => {
    class TestService {
      @Log()
      method1() {
        return 'result1';
      }

      @Log()
      method2() {
        return 'result2';
      }

      @Log()
      method3() {
        return 'result3';
      }
    }

    const service = new TestService();

    // Call methods to trigger decorator initialization
    service.method1();
    service.method2();
    service.method3();

    // Check that we don't have excessive listeners
    const currentListenerCount = process.listenerCount('beforeExit');

    // Should only have 1 additional listener (the global one)
    // Allow for some tolerance in case other tests added listeners
    expect(currentListenerCount - initialListenerCount).toBeLessThanOrEqual(1);
  });

  it('should not create multiple event listeners when creating multiple sink instances', () => {
    // This test simulates the scenario where multiple sinks are created
    // (which happens when using @Log decorators in different classes)

    const { createPinoSink } = require('../../src/pino-sink.js');

    const sink1 = createPinoSink({ service: 'test1' });
    const sink2 = createPinoSink({ service: 'test2' });
    const sink3 = createPinoSink({ service: 'test3' });

    // Use the sinks to ensure they are properly initialized
    sink1({
      level: 'info',
      timestamp: new Date().toISOString(),
      scope: { className: 'Test', methodName: 'test' },
      outcome: 'success',
      durationMs: 1,
    });
    sink2({
      level: 'info',
      timestamp: new Date().toISOString(),
      scope: { className: 'Test', methodName: 'test' },
      outcome: 'success',
      durationMs: 1,
    });
    sink3({
      level: 'info',
      timestamp: new Date().toISOString(),
      scope: { className: 'Test', methodName: 'test' },
      outcome: 'success',
      durationMs: 1,
    });

    // Check that we don't have excessive listeners
    const currentListenerCount = process.listenerCount('beforeExit');

    // Should only have 1 additional listener (the global one)
    expect(currentListenerCount - initialListenerCount).toBeLessThanOrEqual(1);
  });

  it('should handle cleanup properly when process exits', () => {
    const { createPinoSink } = require('../../src/pino-sink.js');

    const sink = createPinoSink({ service: 'cleanup-test' });

    // Simulate a log entry
    sink({
      level: 'info',
      timestamp: new Date().toISOString(),
      scope: { className: 'TestClass', methodName: 'testMethod' },
      outcome: 'success',
      durationMs: 1,
      correlationId: 'test-cid',
    });

    // The sink should be registered for cleanup
    expect(global.__boyscout_logger_sinks).toBeDefined();
    expect(global.__boyscout_logger_sinks?.size).toBeGreaterThan(0);
  });

  it('should not exceed MaxListenersExceededWarning threshold', () => {
    // Create many decorators to test the threshold
    class ManyDecoratorsService {
      @Log() method1() {
        return '1';
      }
      @Log() method2() {
        return '2';
      }
      @Log() method3() {
        return '3';
      }
      @Log() method4() {
        return '4';
      }
      @Log() method5() {
        return '5';
      }
      @Log() method6() {
        return '6';
      }
      @Log() method7() {
        return '7';
      }
      @Log() method8() {
        return '8';
      }
      @Log() method9() {
        return '9';
      }
      @Log() method10() {
        return '10';
      }
    }

    const service = new ManyDecoratorsService();

    // Call all methods to trigger decorator initialization
    for (let i = 1; i <= 10; i++) {
      (service as any)[`method${i}`]();
    }

    // Check that we don't exceed the MaxListeners threshold (10)
    const beforeExitCount = process.listenerCount('beforeExit');
    const exitCount = process.listenerCount('exit');
    const sigintCount = process.listenerCount('SIGINT');
    const sigtermCount = process.listenerCount('SIGTERM');
    const sigquitCount = process.listenerCount('SIGQUIT');

    // Each should be at most 2 (the global listener + any test framework listeners)
    // Allow some tolerance for test framework listeners
    expect(beforeExitCount).toBeLessThanOrEqual(2);
    expect(exitCount).toBeLessThanOrEqual(2);
    expect(sigintCount).toBeLessThanOrEqual(2);
    expect(sigtermCount).toBeLessThanOrEqual(2);
    expect(sigquitCount).toBeLessThanOrEqual(2);
  });
});
