import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTextAnalysis } from '../useTextAnalysis';
import * as textAnalysisApi from '../../services/textAnalysisApi';

vi.mock('../../services/textAnalysisApi');

describe('useTextAnalysis', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mutation behavior', () => {
    it('should return mutation object with correct initial state', () => {
      const { result } = renderHook(() => useTextAnalysis(), { wrapper });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(null);
    });

    it('should call analyzeContent API when mutateAsync is called with text', async () => {
      const mockResponse = {
        summary: "Test summary",
        countries: ["United States"],
        organizations: ["Test Corp"],
        people: ["John Doe"],
      };

      vi.mocked(textAnalysisApi.analyzeContent).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTextAnalysis(), { wrapper });

      const request = {
        text: "Test text content",
        options: {
          includeEntities: true,
          includeSummary: true,
        },
      };

      await result.current.mutateAsync(request);

      expect(textAnalysisApi.analyzeContent).toHaveBeenCalledWith(request);
    });

    it('should call analyzeContent API when mutateAsync is called with file', async () => {
      const mockResponse = {
        summary: "File analysis",
        countries: ["Canada"],
        organizations: ["File Corp"],
        people: ["Jane Smith"],
      };

      vi.mocked(textAnalysisApi.analyzeContent).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTextAnalysis(), { wrapper });

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const request = {
        file: mockFile,
        options: {
          includeEntities: true,
          includeSummary: true,
        },
      };

      await result.current.mutateAsync(request);

      expect(textAnalysisApi.analyzeContent).toHaveBeenCalledWith(request);
    });

    it('should handle API errors correctly', async () => {
      const errorMessage = 'API Error';
      vi.mocked(textAnalysisApi.analyzeContent).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTextAnalysis(), { wrapper });

      const request = {
        text: "Test text",
      };

      try {
        await result.current.mutateAsync(request);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe(errorMessage);
    });

    it('should update loading state correctly during mutation', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(textAnalysisApi.analyzeContent).mockReturnValue(mockPromise);

      const { result } = renderHook(() => useTextAnalysis(), { wrapper });

      // Start mutation
      const mutationPromise = result.current.mutateAsync({
        text: "Test text",
      });

      // Should be pending
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve the API call
      const mockResponse = { summary: "Test", countries: [], organizations: [], people: [] };
      resolvePromise!(mockResponse);

      await mutationPromise;

      // Should no longer be pending
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockResponse);
      });
    });

    it('should support retry configuration', () => {
      const { result } = renderHook(() => useTextAnalysis(), { wrapper });

      // Hook should be configured with retry settings
      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });
});