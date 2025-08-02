import "@testing-library/jest-dom";

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_ANALYZER_API_URL: 'https://test-api.example.com',
  VITE_ANALYZER_API_KEY: 'test-api-key',
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock URL.createObjectURL for file download tests
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();