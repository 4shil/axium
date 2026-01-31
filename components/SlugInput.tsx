'use client';

import { useState, useCallback } from 'react';

interface SlugInputProps {
  value: string;
  onChange: (value: string) => void;
  baseUrl?: string;
}

const SLUG_REGEX = /^[a-z0-9-]*$/;
const MIN_LENGTH = 6;
const MAX_LENGTH = 30;

export default function SlugInput({ value, onChange, baseUrl = 'axium.app' }: SlugInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toLowerCase();
    
    // Only allow valid characters
    if (!SLUG_REGEX.test(input)) {
      setError('ONLY LOWERCASE, NUMBERS, HYPHENS');
      return;
    }

    setError(null);
    onChange(input);
  }, [onChange]);

  const isValid = value.length === 0 || (value.length >= MIN_LENGTH && value.length <= MAX_LENGTH);

  return (
    <div className="space-y-2">
      <label className="axium-label">CUSTOM LINK (OPTIONAL)</label>
      <div className="flex items-stretch">
        <span className="flex items-center px-3 bg-[var(--color-background)] border-3 border-r-0 border-[var(--color-border)] font-mono text-sm text-[var(--color-muted)]" style={{ borderWidth: '3px', borderRightWidth: 0 }}>
          {baseUrl}/
        </span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="your-link"
          maxLength={MAX_LENGTH}
          className="axium-input flex-1"
          style={{ borderLeftWidth: 0 }}
        />
      </div>
      
      <div className="flex justify-between text-xs">
        <span className={error ? 'text-[var(--color-error)] font-mono font-bold' : 'text-[var(--color-muted)]'}>
          {error || (value.length > 0 && value.length < MIN_LENGTH ? `MIN ${MIN_LENGTH} CHARACTERS` : 'LEAVE EMPTY FOR RANDOM')}
        </span>
        <span className={`font-mono ${!isValid ? 'text-[var(--color-error)]' : 'text-[var(--color-muted)]'}`}>
          {value.length}/{MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
