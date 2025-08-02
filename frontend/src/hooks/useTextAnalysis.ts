import { useMutation } from '@tanstack/react-query';
import { analyzeContent, AnalysisResponse, ApiError } from '@/services/textAnalysisApi';

export const useTextAnalysis = (options: { onSuccess?: (data: AnalysisResponse) => void; onError?: (error: Error) => void } = {}) => {
  return useMutation({
    mutationFn: analyzeContent,
    retry: (failureCount, error) => {
      // Only retry network errors, not config/validation errors
      if (error instanceof ApiError && (error.category === 'config' || error.category === 'validation')) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};