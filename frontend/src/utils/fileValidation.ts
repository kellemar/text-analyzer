// File validation utilities
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf'
] as const;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Supported types: .txt, .docx, .pdf`
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0.0KB';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
};

export const getFileTypeLabel = (type: string): string => {
  switch (type) {
    case 'text/plain':
      return 'Text Document';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word Document';
    case 'application/pdf':
      return 'PDF Document';
    default:
      return 'Unknown';
  }
};