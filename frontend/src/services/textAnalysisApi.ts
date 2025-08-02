export interface AnalysisRequest {
  text?: string;
  file?: File;
  accessToken?: string;
  options?: {
    includeEntities?: boolean;
    includeSummary?: boolean;
  };
}

export interface AnalysisResponse {
  summary: string;
  countries: string[];
  organizations: string[];
  people: string[];
}

// Basic error types for categorization
export class ApiError extends Error {
  constructor(message: string, public category: 'config' | 'validation' | 'network' | 'request') {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const analyzeContent = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  const apiUrl = import.meta.env.VITE_ANALYZER_API_URL;
  const apiKey = import.meta.env.VITE_ANALYZER_API_KEY;

  // Security check
  if (!apiUrl.startsWith('https://')) {
    throw new ApiError('API URL must use HTTPS for security', 'config');
  }

  // Input validation
  if (!request.text?.trim() && !request.file) {
    throw new ApiError('Either text or file must be provided', 'validation');
  }

  // Authorization validation
  if (!request.accessToken) {
    throw new ApiError('Authentication required. Please log in again.', 'validation');
  }

  const formData = new FormData();
  
  if (request.file) {
    formData.append('file', request.file);
  } else if (request.text) {
    formData.append('text', request.text);
  }
  
  if (request.options) {
    formData.append('options', JSON.stringify(request.options));
  }

  // Add timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${apiUrl}/analyze`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${request.accessToken}`
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`Analysis failed: ${response.status} ${response.statusText}`, 'request');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) throw error;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please try again.', 'network');
      }
      if (error.message.includes('fetch')) {
        throw new ApiError('Network error. Please check your connection.', 'network');
      }
    }
    
    throw new ApiError('Unknown error occurred', 'request');
  }
};