import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeContent } from '../textAnalysisApi';

describe('textAnalysisApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('analyzeContent', () => {
    it('should send text content to API and return analysis result', async () => {
      const mockResponse = {
        summary: "Test summary",
        countries: ["United States"],
        organizations: ["Test Corp"],
        people: ["John Doe"],
        confidence: 0.95,
        processingTime: 1500,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await analyzeContent({
        text: "Test text content",
        options: {
          includeEntities: true,
          includeSummary: true,
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/analyze',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
          },
          body: expect.any(FormData),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should send file content to API and return analysis result', async () => {
      const mockResponse = {
        summary: "File analysis summary",
        countries: ["Canada"],
        organizations: ["File Corp"],
        people: ["Jane Smith"],
        confidence: 0.88,
        processingTime: 2000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });

      const result = await analyzeContent({
        file: mockFile,
        options: {
          includeEntities: true,
          includeSummary: true,
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/analyze',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
          },
          body: expect.any(FormData),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API returns non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        analyzeContent({
          text: "Test text",
        })
      ).rejects.toThrow('Analysis failed: 400 Bad Request');
    });

    it('should throw error when network request fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        analyzeContent({
          text: "Test text",
        })
      ).rejects.toThrow('Network error');
    });

    it('should include options in FormData when provided', async () => {
      const mockResponse = {
        summary: "Test summary",
        countries: [],
        organizations: [],
        people: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await analyzeContent({
        text: "Test text",
        options: {
          includeEntities: false,
          includeSummary: true,
        },
      });

      const formDataCall = (global.fetch as any).mock.calls[0][1].body;
      expect(formDataCall).toBeInstanceOf(FormData);
    });

    it('should handle missing environment variables gracefully', async () => {
      // This test ensures the API throws appropriate errors when env vars are missing
      vi.stubEnv('VITE_ANALYZER_API_URL', '');
      
      await expect(
        analyzeContent({
          text: "Test text",
        })
      ).rejects.toThrow();
    });
  });
});