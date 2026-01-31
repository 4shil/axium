'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface FileInfo {
  filename: string;
  size: string;
  expiresAt: string;
  requiresPassword: boolean;
  downloadCount: number;
  oneTimeDownload: boolean;
  maxDownloads: number | null;
}

const formatSize = (bytes: string): string => {
  const num = parseInt(bytes);
  if (num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTimeRemaining = (expiresAt: string): string => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'EXPIRED';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function DownloadPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch file info
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/download?slug=${slug}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'FILE NOT FOUND');
          return;
        }
        
        setFileInfo(data);
      } catch {
        setError('FAILED TO LOAD FILE');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInfo();
  }, [slug]);

  // Update timer
  useEffect(() => {
    if (!fileInfo) return;
    
    const update = () => {
      setTimeRemaining(formatTimeRemaining(fileInfo.expiresAt));
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [fileInfo]);

  const handleDownload = async () => {
    if (!fileInfo) return;
    
    setDownloading(true);
    setPasswordError(false);
    
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password: password || undefined }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          setPasswordError(true);
        } else {
          setError(data.error || 'DOWNLOAD FAILED');
        }
        return;
      }
      
      // Redirect to download URL
      window.location.href = data.downloadUrl;
      
      // If one-time download, show message
      if (fileInfo.oneTimeDownload) {
        setTimeout(() => {
          setError('FILE PURGED');
        }, 2000);
      }
      
    } catch {
      setError('DOWNLOAD FAILED');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="axium-card p-8 text-center">
          <p className="font-mono font-bold text-xl">LOADING...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="axium-card p-8 text-center max-w-md w-full space-y-6">
          <div className="text-6xl">✕</div>
          <p className="font-mono font-bold text-xl text-[var(--color-error)]">{error}</p>
          <Link href="/" className="axium-button inline-block">
            UPLOAD NEW FILE
          </Link>
        </div>
      </main>
    );
  }

  if (!fileInfo) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="axium-card p-8 max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="font-mono text-2xl font-black tracking-wider">
            AXIUM
          </Link>
        </div>

        {/* File Info */}
        <div className="space-y-4">
          <div>
            <p className="axium-label">FILE</p>
            <p className="font-mono font-bold text-lg truncate">{fileInfo.filename}</p>
          </div>
          
          <div className="flex gap-6">
            <div>
              <p className="axium-label">SIZE</p>
              <p className="font-mono font-bold">{formatSize(fileInfo.size)}</p>
            </div>
            <div>
              <p className="axium-label">EXPIRES IN</p>
              <p className={`axium-timer text-lg ${timeRemaining === 'EXPIRED' ? 'text-[var(--color-error)]' : ''}`}>
                {timeRemaining}
              </p>
            </div>
          </div>

          {fileInfo.oneTimeDownload && (
            <div className="bg-[var(--color-background)] border-3 border-[var(--color-border)] p-3" style={{ borderWidth: '3px' }}>
              <p className="font-mono text-sm font-bold">⚠ ONE-TIME DOWNLOAD</p>
              <p className="text-xs text-[var(--color-muted)]">File will be deleted after download</p>
            </div>
          )}

          {fileInfo.maxDownloads && (
            <p className="font-mono text-sm text-[var(--color-muted)]">
              Downloads: {fileInfo.downloadCount}/{fileInfo.maxDownloads}
            </p>
          )}
        </div>

        {/* Password Input */}
        {fileInfo.requiresPassword && (
          <div className="space-y-2">
            <label className="axium-label">PASSWORD REQUIRED</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`axium-input ${passwordError ? 'border-[var(--color-error)]' : ''}`}
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            />
            {passwordError && (
              <p className="font-mono text-sm font-bold text-[var(--color-error)]">
                INVALID PASSWORD
              </p>
            )}
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading || timeRemaining === 'EXPIRED' || (fileInfo.requiresPassword && !password)}
          className="axium-button w-full"
        >
          {downloading ? 'DOWNLOADING...' : 'DOWNLOAD FILE'}
        </button>

        {/* Privacy Note */}
        <p className="text-center text-xs text-[var(--color-muted)]">
          Files are automatically deleted after expiry.
        </p>
      </div>
    </main>
  );
}
