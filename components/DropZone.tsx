'use client';

import { useState, useRef, useCallback } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  maxSize?: number; // in bytes
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function DropZone({ onFileSelect, disabled, maxSize = 500 * 1024 * 1024 }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    if (file.size > maxSize) {
      setError(`FILE TOO LARGE. MAX ${formatSize(maxSize)}`);
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div
      className={`axium-dropzone p-12 text-center ${isDragging ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      
      <div className="space-y-4">
        <div className="text-6xl">⬆</div>
        <div>
          <p className="font-mono text-xl font-bold uppercase tracking-wider">
            {isDragging ? 'DROP FILE' : 'DRAG & DROP'}
          </p>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            or click to select • max {formatSize(maxSize)}
          </p>
        </div>
        
        {error && (
          <p className="font-mono text-sm font-bold text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
