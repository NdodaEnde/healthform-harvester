/**
 * Document Validation Utilities for Production
 * Enhanced validation for document uploads and processing
 */

import { errorMonitoring } from './errorMonitoring';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DocumentValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  requireAuth?: boolean;
  requireOrganization?: boolean;
}

const DEFAULT_OPTIONS: DocumentValidationOptions = {
  maxSizeBytes: 25 * 1024 * 1024, // 25MB
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  requireAuth: true,
  requireOrganization: true
};

export class DocumentValidator {
  
  static validateFile(file: File, options: DocumentValidationOptions = {}): ValidationResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check file size
      if (file.size > (opts.maxSizeBytes || DEFAULT_OPTIONS.maxSizeBytes!)) {
        result.errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${((opts.maxSizeBytes || DEFAULT_OPTIONS.maxSizeBytes!) / 1024 / 1024).toFixed(0)}MB)`);
        result.isValid = false;
      }

      // Check file type
      if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
        result.errors.push(`File type "${file.type}" is not supported. Allowed types: ${opts.allowedTypes.join(', ')}`);
        result.isValid = false;
      }

      // Check file name
      if (!file.name || file.name.length < 3) {
        result.errors.push('File name is too short');
        result.isValid = false;
      }

      // Security check for file name
      const suspiciousChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (suspiciousChars.test(file.name)) {
        result.errors.push('File name contains invalid characters');
        result.isValid = false;
      }

      // Check for very large images that might cause processing issues
      if (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
        result.warnings.push('Large image files may take longer to process');
      }

      // Warn about non-PDF files
      if (file.type !== 'application/pdf') {
        result.warnings.push('PDF files typically provide better text extraction results');
      }

    } catch (error) {
      errorMonitoring.logError(error as Error, {
        component: 'DocumentValidator',
        severity: 'medium'
      });
      
      result.errors.push('File validation failed due to an unexpected error');
      result.isValid = false;
    }

    return result;
  }

  static validateBatch(files: FileList | File[], options: DocumentValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const filesArray = Array.from(files);

    // Check batch size
    if (filesArray.length === 0) {
      result.errors.push('No files selected');
      result.isValid = false;
      return result;
    }

    if (filesArray.length > 20) {
      result.errors.push('Too many files selected. Maximum 20 files per batch');
      result.isValid = false;
    }

    // Calculate total size
    const totalSize = filesArray.reduce((sum, file) => sum + file.size, 0);
    const maxBatchSize = 100 * 1024 * 1024; // 100MB total

    if (totalSize > maxBatchSize) {
      result.errors.push(`Total batch size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum (100MB)`);
      result.isValid = false;
    }

    // Validate each file
    const invalidFiles = [];
    for (const file of filesArray) {
      const fileResult = this.validateFile(file, options);
      if (!fileResult.isValid) {
        invalidFiles.push(`${file.name}: ${fileResult.errors.join(', ')}`);
      }
      result.warnings.push(...fileResult.warnings);
    }

    if (invalidFiles.length > 0) {
      result.errors.push(...invalidFiles);
      result.isValid = false;
    }

    return result;
  }

  static sanitizeFileName(fileName: string): string {
    // Remove or replace problematic characters
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .trim();
  }

  static getFileTypeFromExtension(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    return typeMap[extension || ''] || 'application/octet-stream';
  }
}

// Production-ready file upload with retry logic
export class FileUploadManager {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async uploadWithRetry(
    uploadFn: () => Promise<any>,
    fileName: string,
    retries: number = this.MAX_RETRIES
  ): Promise<any> {
    try {
      return await uploadFn();
    } catch (error) {
      errorMonitoring.logError(error as Error, {
        component: 'FileUploadManager',
        severity: 'medium'
      });

      if (retries > 0) {
        console.warn(`Upload failed for ${fileName}, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.uploadWithRetry(uploadFn, fileName, retries - 1);
      }
      
      throw new Error(`Upload failed for ${fileName} after ${this.MAX_RETRIES} attempts: ${(error as Error).message}`);
    }
  }
}