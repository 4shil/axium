'use client';

import { useState } from 'react';

interface SecurityOptionsProps {
  password: string;
  onPasswordChange: (password: string) => void;
  oneTimeDownload: boolean;
  onOneTimeChange: (value: boolean) => void;
  maxDownloads: number | null;
  onMaxDownloadsChange: (value: number | null) => void;
}

export default function SecurityOptions({
  password,
  onPasswordChange,
  oneTimeDownload,
  onOneTimeChange,
  maxDownloads,
  onMaxDownloadsChange,
}: SecurityOptionsProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <p className="axium-label">SECURITY OPTIONS</p>
      
      {/* Password Protection */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={password.length > 0}
            onChange={(e) => onPasswordChange(e.target.checked ? '' : '')}
            className="axium-checkbox"
            id="password-toggle"
          />
          <label htmlFor="password-toggle" className="font-mono text-sm font-medium cursor-pointer">
            PASSWORD PROTECTED
          </label>
        </div>
        
        {password !== undefined && (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter password"
              className="axium-input pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        )}
      </div>

      {/* One-Time Download */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={oneTimeDownload}
          onChange={(e) => {
            onOneTimeChange(e.target.checked);
            if (e.target.checked) onMaxDownloadsChange(null);
          }}
          className="axium-checkbox"
          id="one-time"
        />
        <label htmlFor="one-time" className="font-mono text-sm font-medium cursor-pointer">
          ONE-TIME DOWNLOAD
        </label>
      </div>

      {/* Max Downloads */}
      {!oneTimeDownload && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={maxDownloads !== null}
              onChange={(e) => onMaxDownloadsChange(e.target.checked ? 5 : null)}
              className="axium-checkbox"
              id="max-downloads"
            />
            <label htmlFor="max-downloads" className="font-mono text-sm font-medium cursor-pointer">
              LIMIT DOWNLOADS
            </label>
          </div>
          
          {maxDownloads !== null && (
            <input
              type="number"
              min={1}
              max={100}
              value={maxDownloads}
              onChange={(e) => onMaxDownloadsChange(parseInt(e.target.value) || 1)}
              className="axium-input w-32"
            />
          )}
        </div>
      )}
    </div>
  );
}
