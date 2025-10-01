import { expect, test } from '@playwright/test';

test.describe('Integration Tests - Complete Workflows', () => {
  test('Complete user lifecycle with logging', async ({ request }) => {
    // 1. Create user
    const userData = {
      name: 'Integration Test User',
      email: 'integration@example.com',
      password: 'senha123456',
      cardNumber: '1234567890123456',
    };

    const createResponse = await request.post('/api/users', { data: userData });
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json();

    // 2. Track analytics for user creation
    const analyticsResponse = await request.post('/api/analytics/track', {
      data: { event: 'user_created', data: { userId: createdUser.id } },
    });
    expect(analyticsResponse.status()).toBe(201);

    // 3. Monitor business event
    const monitoringResponse = await request.post('/api/monitoring/business-event', {
      data: { event: 'user_registration_completed', data: { userId: createdUser.id } },
    });
    expect(monitoringResponse.status()).toBe(201);

    // 4. Get user details
    const getUserResponse = await request.get(`/api/users/${createdUser.id}`);
    expect(getUserResponse.status()).toBe(200);

    // 5. Update user
    const updateResponse = await request.put(`/api/users/${createdUser.id}`, {
      data: { name: 'Updated Integration Test User' },
    });
    expect(updateResponse.status()).toBe(200);

    // 6. Track analytics for user update
    const updateAnalyticsResponse = await request.post('/api/analytics/track', {
      data: { event: 'user_updated', data: { userId: createdUser.id } },
    });
    expect(updateAnalyticsResponse.status()).toBe(201);

    // 7. Get user stats
    const statsResponse = await request.get('/api/users/stats');
    expect(statsResponse.status()).toBe(200);

    // 8. Delete user
    const deleteResponse = await request.delete(`/api/users/${createdUser.id}`);
    expect(deleteResponse.status()).toBe(200);

    // 9. Track analytics for user deletion
    const deleteAnalyticsResponse = await request.post('/api/analytics/track', {
      data: { event: 'user_deleted', data: { userId: createdUser.id } },
    });
    expect(deleteAnalyticsResponse.status()).toBe(201);

    // 10. Monitor system event
    const systemMonitoringResponse = await request.post('/api/monitoring/system-error', {
      data: {
        error: { name: 'UserLifecycleCompleted', message: 'User lifecycle completed successfully' },
        context: { userId: createdUser.id, operation: 'lifecycle_complete' },
      },
    });
    expect(systemMonitoringResponse.status()).toBe(201);
  });

  test('Analytics and monitoring integration', async ({ request }) => {
    // 1. Track multiple events
    const events = [
      { event: 'page_view', data: { page: '/home' } },
      { event: 'button_click', data: { button: 'signup' } },
      { event: 'form_submit', data: { form: 'contact' } },
    ];

    for (const eventData of events) {
      const response = await request.post('/api/analytics/track', { data: eventData });
      expect(response.status()).toBe(201);
    }

    // 2. Get analytics metrics
    const metricsResponse = await request.get('/api/analytics/metrics');
    expect(metricsResponse.status()).toBe(200);

    // 3. Get performance metrics
    const performanceResponse = await request.get('/api/analytics/performance');
    expect(performanceResponse.status()).toBe(200);

    // 4. Generate analytics report
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1);
    const endDate = new Date();

    const reportResponse = await request.post('/api/analytics/report', {
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    expect(reportResponse.status()).toBe(201);

    // 5. Monitor analytics events
    const monitoringEvents = [
      { event: 'analytics_processed', data: { eventsCount: events.length } },
      { event: 'report_generated', data: { reportType: 'analytics' } },
    ];

    for (const eventData of monitoringEvents) {
      const response = await request.post('/api/monitoring/business-event', { data: eventData });
      expect(response.status()).toBe(201);
    }

    // 6. Get monitoring summary
    const summaryResponse = await request.get('/api/monitoring/summary');
    expect(summaryResponse.status()).toBe(200);
  });

  test('Health monitoring integration', async ({ request }) => {
    // 1. Perform health check
    const healthResponse = await request.get('/api/health');
    expect(healthResponse.status()).toBe(200);

    // 2. Get detailed metrics
    const metricsResponse = await request.get('/api/health/metrics');
    expect(metricsResponse.status()).toBe(200);

    // 3. Monitor health check
    const monitoringResponse = await request.post('/api/monitoring/performance-metric', {
      data: { metric: 'health_check_duration', value: 50.5 },
    });
    expect(monitoringResponse.status()).toBe(201);

    // 4. Track health analytics
    const analyticsResponse = await request.post('/api/analytics/track', {
      data: { event: 'health_check_performed', data: { status: 'healthy' } },
    });
    expect(analyticsResponse.status()).toBe(201);

    // 5. Reset health counters
    const resetResponse = await request.get('/api/health/reset');
    expect(resetResponse.status()).toBe(200);

    // 6. Verify reset
    const healthAfterResetResponse = await request.get('/api/health');
    expect(healthAfterResetResponse.status()).toBe(200);
  });

  test('Error handling and logging integration', async ({ request }) => {
    // 1. Trigger error endpoint
    const errorResponse = await request.get('/api/error');
    expect(errorResponse.status()).toBe(500);

    // 2. Monitor system error
    const systemErrorResponse = await request.post('/api/monitoring/system-error', {
      data: {
        error: { name: 'TestError', message: 'Test error for integration' },
        context: { endpoint: '/api/error', timestamp: new Date().toISOString() },
      },
    });
    expect(systemErrorResponse.status()).toBe(201);

    // 3. Track error analytics
    const errorAnalyticsResponse = await request.post('/api/analytics/track', {
      data: { event: 'error_occurred', data: { errorType: 'TestError' } },
    });
    expect(errorAnalyticsResponse.status()).toBe(201);

    // 4. Monitor security event
    const securityResponse = await request.post('/api/monitoring/security-event', {
      data: { event: 'error_monitoring', details: { error: 'TestError' } },
    });
    expect(securityResponse.status()).toBe(201);

    // 5. Get error logs
    const logsResponse = await request.get('/api/monitoring/logs?level=error');
    expect(logsResponse.status()).toBe(200);
  });

  test('Complete application monitoring workflow', async ({ request }) => {
    // 1. Start with health check
    const healthResponse = await request.get('/api/health');
    expect(healthResponse.status()).toBe(200);

    // 2. Create some test data
    const userData = {
      name: 'Monitoring Test User',
      email: 'monitoring@example.com',
      password: 'senha123456',
    };

    const createUserResponse = await request.post('/api/users', { data: userData });
    expect(createUserResponse.status()).toBe(201);
    const createdUser = await createUserResponse.json();

    // 3. Track business events
    const businessEvents = [
      { event: 'user_created', data: { userId: createdUser.id } },
      { event: 'user_accessed', data: { userId: createdUser.id } },
    ];

    for (const eventData of businessEvents) {
      const response = await request.post('/api/monitoring/business-event', { data: eventData });
      expect(response.status()).toBe(201);
    }

    // 4. Track analytics
    const analyticsEvents = [
      { event: 'user_action', data: { action: 'create', userId: createdUser.id } },
      { event: 'user_action', data: { action: 'access', userId: createdUser.id } },
    ];

    for (const eventData of analyticsEvents) {
      const response = await request.post('/api/analytics/track', { data: eventData });
      expect(response.status()).toBe(201);
    }

    // 5. Monitor performance
    const performanceMetrics = [
      { metric: 'user_creation_time', value: 150.5 },
      { metric: 'user_access_time', value: 75.2 },
    ];

    for (const metricData of performanceMetrics) {
      const response = await request.post('/api/monitoring/performance-metric', {
        data: metricData,
      });
      expect(response.status()).toBe(201);
    }

    // 6. Get comprehensive reports
    const reports = [
      request.get('/api/analytics/metrics'),
      request.get('/api/analytics/performance'),
      request.get('/api/monitoring/summary'),
      request.get('/api/users/stats'),
    ];

    const reportResponses = await Promise.all(reports);
    for (const response of reportResponses) {
      expect(response.status()).toBe(200);
    }

    // 7. Cleanup
    const deleteUserResponse = await request.delete(`/api/users/${createdUser.id}`);
    expect(deleteUserResponse.status()).toBe(200);

    // 8. Final health check
    const finalHealthResponse = await request.get('/api/health');
    expect(finalHealthResponse.status()).toBe(200);
  });
});

test.describe('Cross-Module Integration Tests', () => {
  test('User and Analytics integration', async ({ request }) => {
    // Create user and track analytics
    const userData = {
      name: 'Cross Module User',
      email: 'crossmodule@example.com',
      password: 'senha123456',
    };

    const createResponse = await request.post('/api/users', { data: userData });
    expect(createResponse.status()).toBe(201);
    const user = await createResponse.json();

    // Track user creation analytics
    const analyticsResponse = await request.post('/api/analytics/track', {
      data: { event: 'user_created', data: { userId: user.id } },
    });
    expect(analyticsResponse.status()).toBe(201);

    // Get analytics metrics
    const metricsResponse = await request.get('/api/analytics/metrics');
    expect(metricsResponse.status()).toBe(200);

    // Search users
    const searchResponse = await request.get('/api/users/search?q=Cross');
    expect(searchResponse.status()).toBe(200);

    // Cleanup
    await request.delete(`/api/users/${user.id}`);
  });

  test('Analytics and Monitoring integration', async ({ request }) => {
    // Track analytics events
    const events = [
      { event: 'integration_test', data: { test: true } },
      { event: 'monitoring_test', data: { test: true } },
    ];

    for (const eventData of events) {
      const response = await request.post('/api/analytics/track', { data: eventData });
      expect(response.status()).toBe(201);
    }

    // Monitor analytics events
    const monitoringResponse = await request.post('/api/monitoring/business-event', {
      data: { event: 'analytics_integration', data: { eventsCount: events.length } },
    });
    expect(monitoringResponse.status()).toBe(201);

    // Get both analytics and monitoring data
    const [analyticsResponse, monitoringSummaryResponse] = await Promise.all([
      request.get('/api/analytics/metrics'),
      request.get('/api/monitoring/summary'),
    ]);

    expect(analyticsResponse.status()).toBe(200);
    expect(monitoringSummaryResponse.status()).toBe(200);
  });

  test('Health and Monitoring integration', async ({ request }) => {
    // Perform health check
    const healthResponse = await request.get('/api/health');
    expect(healthResponse.status()).toBe(200);

    // Monitor health check
    const monitoringResponse = await request.post('/api/monitoring/performance-metric', {
      data: { metric: 'health_check_success', value: 1 },
    });
    expect(monitoringResponse.status()).toBe(201);

    // Get health metrics
    const healthMetricsResponse = await request.get('/api/health/metrics');
    expect(healthMetricsResponse.status()).toBe(200);

    // Get monitoring summary
    const monitoringSummaryResponse = await request.get('/api/monitoring/summary');
    expect(monitoringSummaryResponse.status()).toBe(200);
  });
});
