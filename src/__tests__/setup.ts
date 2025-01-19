import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid'
  }
});

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-key';

// Mock Anthropic client
vi.mock('@anthropic-ai/sdk', () => {
  return {
    Anthropic: class MockAnthropic {
      messages = {
        create: async () => ({
          content: [{
            type: 'text',
            text: JSON.stringify({
              anomalies: [{
                type: 'spike',
                timestamp: '2024-03-01T03:00:00Z',
                severity: 'high',
                potentialCauses: ['Equipment malfunction']
              }],
              savings: [{
                description: 'Optimize peak usage',
                potentialAmount: 100,
                effort: 'medium'
              }],
              recommendations: [{
                title: 'Peak Load Management',
                description: 'Implement load shifting',
                priority: 'high'
              }],
              patterns: [{
                type: 'increasing',
                description: 'Gradual increase in consumption',
                significance: 'high'
              }]
            })
          }]
        })
      }
    }
  };
});
