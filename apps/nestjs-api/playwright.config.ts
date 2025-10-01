import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração simplificada do Playwright para testes E2E
 */

const baseURL = process.env.BASE_URL || 'http://localhost:3000/api';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000, // 30 segundos por teste
  expect: {
    timeout: 10000, // 10 segundos para expectativas
  },

  // Reporter
  reporter: [['html'], ...(process.env.CI ? [['github'] as ['github']] : [])],

  // Configurações compartilhadas
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Servidor de desenvolvimento
  webServer: {
    command: 'npx nx serve nestjs-api',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: workspaceRoot,
  },

  // Apenas Chromium (mais rápido e suficiente para testes de API)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
