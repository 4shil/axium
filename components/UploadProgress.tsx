'use client';

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  onCancel?: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function UploadProgress({ fileName, fileSize, progress, onCancel }: UploadProgressProps) {
  return (
    <div className="axium-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono font-bold truncate">{fileName}</p>
          <p className="axium-label mt-1">{formatSize(fileSize)}</p>
        </div>
        {onCancel && progress < 100 && (
          <button
            onClick={onCancel}
            className="axium-button-secondary !p-2"
            aria-label="Cancel upload"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="axium-progress">
          <div 
            className="axium-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="axium-status">
            {progress < 100 ? 'UPLOADING...' : 'PROCESSING...'}
          </span>
          <span className="font-mono font-bold">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
