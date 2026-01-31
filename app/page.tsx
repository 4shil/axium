'use client';

import { useState, useCallback } from 'react';
import DropZone from '@/components/DropZone';
import UploadProgress from '@/components/UploadProgress';
import ExpirySelector from '@/components/ExpirySelector';
import SlugInput from '@/components/SlugInput';
import SecurityOptions from '@/components/SecurityOptions';

interface UploadResult {
  slug: string;
  expiresAt: string;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [expiryMinutes, setExpiryMinutes] = useState(120);
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [oneTimeDownload, setOneTimeDownload] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get presigned upload URL
      const initRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
          expiryMinutes,
          slug: slug || undefined,
          password: password || undefined,
          oneTimeDownload,
          maxDownloads,
        }),
      });

      const initData = await initRes.json();
      
      if (!initRes.ok) {
        throw new Error(initData.error || 'UPLOAD FAILED');
      }

      setProgress(10);

      // Step 2: Upload file directly to B2
      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = 10 + (e.loaded / e.total) * 85;
            setProgress(Math.round(percentComplete));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('UPLOAD TO STORAGE FAILED'));
          }
        };

        xhr.onerror = () => reject(new Error('UPLOAD FAILED'));

        xhr.open('PUT', initData.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      setProgress(100);

      // Success!
      setResult({
        slug: initData.slug,
        expiresAt: initData.expiresAt,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLOAD FAILED');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!result) return;
    const url = `${window.location.origin}/${result.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setExpiryMinutes(120);
    setSlug('');
    setPassword('');
    setOneTimeDownload(false);
    setMaxDownloads(null);
    setProgress(0);
    setError(null);
    setResult(null);
    setCopied(false);
  };

  // Success state
  if (result) {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${result.slug}`;
    
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="axium-card p-8 max-w-lg w-full space-y-6 text-center">
          <div className="text-6xl">✓</div>
          <h2 className="font-mono text-2xl font-black">FILE UPLOADED</h2>
          
          <div className="space-y-2">
            <p className="axium-label">SHARE LINK</p>
            <div className="axium-input axium-link text-left break-all">
              {shareUrl}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleCopyLink} className="axium-button">
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
            <button onClick={handleReset} className="axium-button-secondary">
              NEW UPLOAD
            </button>
          </div>

          <p className="text-sm text-[var(--color-muted)]">
            Expires: {new Date(result.expiresAt).toLocaleString()}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="font-mono text-5xl md:text-6xl font-black tracking-wider">
            AXIUM
          </h1>
          <p className="text-[var(--color-muted)] font-mono text-sm uppercase tracking-widest">
            Upload. Share. Expire.
          </p>
        </header>

        {/* Upload Area */}
        <div className="axium-card p-6 space-y-6">
          {!file ? (
            <DropZone onFileSelect={handleFileSelect} disabled={uploading} />
          ) : uploading ? (
            <UploadProgress
              fileName={file.name}
              fileSize={file.size}
              progress={progress}
            />
          ) : (
            <>
              {/* Selected File */}
              <div className="flex items-center justify-between gap-4 p-4 bg-[var(--color-background)] border-3 border-[var(--color-border)]" style={{ borderWidth: '3px' }}>
                <div className="min-w-0">
                  <p className="font-mono font-bold truncate">{file.name}</p>
                  <p className="axium-label">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="axium-button-secondary !p-2"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>

              {/* Options */}
              <div className="space-y-6">
                <ExpirySelector value={expiryMinutes} onChange={setExpiryMinutes} />
                <SlugInput value={slug} onChange={setSlug} />
                <SecurityOptions
                  password={password}
                  onPasswordChange={setPassword}
                  oneTimeDownload={oneTimeDownload}
                  onOneTimeChange={setOneTimeDownload}
                  maxDownloads={maxDownloads}
                  onMaxDownloadsChange={setMaxDownloads}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="font-mono font-bold text-[var(--color-error)] text-center">
                  {error}
                </p>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="axium-button w-full"
              >
                UPLOAD FILE
              </button>
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <footer className="text-center text-xs text-[var(--color-muted)] space-y-1">
          <p>Files are deleted automatically after expiry.</p>
          <p>No accounts. No tracking. No permanent storage.</p>
        </footer>
      </div>
    </main>
  );
}
