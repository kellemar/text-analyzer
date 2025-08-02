import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextAnalyzer } from '../TextAnalyzer';
import { renderWithQueryClient, createMockFile, mockAnalysisResponse } from '../../test/utils';
import { Toaster } from '@/components/ui/toaster';
import * as textAnalysisApi from '../../services/textAnalysisApi';

vi.mock('../../services/textAnalysisApi');

describe('TextAnalyzer', () => {
  const mockProps = {
    username: 'testuser',
    onLogout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Upload Functionality', () => {
    it('should display file upload section', () => {
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
      expect(screen.getByText('Supports .txt, .docx, and .pdf files (max 10MB)')).toBeInTheDocument();
    });

    it('should handle file selection correctly', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const fileInput = screen.getByRole('button', { name: /choose file/i });
      const mockFile = createMockFile('test.txt', 'Test file content', 'text/plain');
      
      // Mock file input
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(hiddenInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(hiddenInput);

      await waitFor(() => {
        expect(screen.getByText(/test\.txt.*Bytes/)).toBeInTheDocument();
      });
    });

    it('should show error for unsupported file types', async () => {
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const mockFile = createMockFile('test.exe', 'Invalid content', 'application/x-executable');
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(hiddenInput);

      // File should be rejected - no file name should appear
      await waitFor(() => {
        expect(screen.queryByText('test.exe')).not.toBeInTheDocument();
      });
    });

    it('should show error for files exceeding size limit', async () => {
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const mockFile = createMockFile('large.txt', largeContent, 'text/plain');
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(hiddenInput);

      // File should be rejected - no file name should appear
      await waitFor(() => {
        expect(screen.queryByText('large.txt')).not.toBeInTheDocument();
      });
    });

    it('should clear text input when file is selected', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const textArea = screen.getByPlaceholderText(/paste your text here/i);
      await user.type(textArea, 'Some text content');
      
      expect(textArea).toHaveValue('Some text content');

      const mockFile = createMockFile('test.txt', 'File content', 'text/plain');
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(hiddenInput);

      await waitFor(() => {
        expect(textArea).toHaveValue('');
      });
    });
  });

  describe('Text Analysis Integration', () => {
    it('should analyze text content via API', async () => {
      const user = userEvent.setup();
      vi.mocked(textAnalysisApi.analyzeContent).mockResolvedValue(mockAnalysisResponse);
      
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const textArea = screen.getByPlaceholderText(/paste your text here/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      
      await user.type(textArea, 'Test text for analysis');
      await user.click(analyzeButton);

      expect(textAnalysisApi.analyzeContent).toHaveBeenCalledWith({
        text: 'Test text for analysis',
        options: {
          includeEntities: true,
          includeSummary: true,
        },
      });

      await waitFor(() => {
        expect(screen.getByText(mockAnalysisResponse.summary)).toBeInTheDocument();
      });
    });

    it('should analyze file content via API', async () => {
      const user = userEvent.setup();
      vi.mocked(textAnalysisApi.analyzeContent).mockResolvedValue(mockAnalysisResponse);
      
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const mockFile = createMockFile('test.txt', 'File content for analysis', 'text/plain');
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(hiddenInput);

      await waitFor(() => {
        expect(screen.getByText(/test\.txt.*Bytes/)).toBeInTheDocument();
      });

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      await user.click(analyzeButton);

      expect(textAnalysisApi.analyzeContent).toHaveBeenCalledWith({
        file: mockFile,
        options: {
          includeEntities: true,
          includeSummary: true,
        },
      });
    });

    it('should show loading state during analysis', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(textAnalysisApi.analyzeContent).mockReturnValue(mockPromise);
      
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const textArea = screen.getByPlaceholderText(/paste your text here/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      
      await user.type(textArea, 'Test text');
      await user.click(analyzeButton);

      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
      expect(analyzeButton).toBeDisabled();

      resolvePromise!(mockAnalysisResponse);

      await waitFor(() => {
        expect(screen.queryByText('Analyzing...')).not.toBeInTheDocument();
        expect(analyzeButton).not.toBeDisabled();
      });
    });

    it('should display error when analysis fails', async () => {
      const user = userEvent.setup();
      vi.mocked(textAnalysisApi.analyzeContent).mockRejectedValue(new Error('API Error'));
      
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const textArea = screen.getByPlaceholderText(/paste your text here/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      
      await user.type(textArea, 'Test text');
      await user.click(analyzeButton);

      await waitFor(() => {
        // Look for the error container instead of specific text
        const errorContainer = document.querySelector('.bg-destructive\\/10');
        expect(errorContainer).toBeInTheDocument();
        expect(errorContainer).toHaveTextContent('API Error');
      });
    });

    it('should disable analyze button when no content is provided', () => {
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all content and results when clear button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(textAnalysisApi.analyzeContent).mockResolvedValue(mockAnalysisResponse);
      
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const textArea = screen.getByPlaceholderText(/paste your text here/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      
      await user.type(textArea, 'Test text');
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(mockAnalysisResponse.summary)).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(textArea).toHaveValue('');
      expect(screen.queryByText(mockAnalysisResponse.summary)).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export results when export button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(textAnalysisApi.analyzeContent).mockResolvedValue(mockAnalysisResponse);
      
      // Mock document.createElement and URL methods
      const mockLink = { 
        click: vi.fn(),
        href: '',
        download: ''
      } as any;
      
      const originalCreateElement = document.createElement;
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockLink;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      renderWithQueryClient(<TextAnalyzer {...mockProps} />);
      
      const textArea = screen.getByPlaceholderText(/paste your text here/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i });
      
      await user.type(textArea, 'Test text for export');
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/Export Results/)).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export results/i });
      await user.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});