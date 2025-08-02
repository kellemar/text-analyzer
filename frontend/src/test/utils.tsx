import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

// Create a wrapper component for React Query
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithQueryClient = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

// Mock API responses
export const mockAnalysisResponse = {
  summary: "Test summary of the analyzed text content.",
  countries: ["United States", "Canada"],
  organizations: ["Test Corp", "Example Inc"],
  people: ["John Doe", "Jane Smith"],
  confidence: 0.95,
  processingTime: 1500,
};

// Create a mock file for testing
export const createMockFile = (
  name: string = 'test.txt',
  content: string = 'Test file content',
  type: string = 'text/plain'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};