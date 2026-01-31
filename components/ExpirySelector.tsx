'use client';

interface ExpirySelectorProps {
  value: number; // minutes
  onChange: (minutes: number) => void;
}

const EXPIRY_OPTIONS = [
  { label: '10 MIN', value: 10 },
  { label: '1 HOUR', value: 60 },
  { label: '2 HOURS', value: 120 },
];

export default function ExpirySelector({ value, onChange }: ExpirySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="axium-label">EXPIRES IN</label>
      <div className="flex gap-2 flex-wrap">
        {EXPIRY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 font-mono font-bold text-sm border-3 border-[var(--color-border)] transition-all ${
              value === option.value
                ? 'bg-[var(--color-accent)] text-white shadow-[3px_3px_0px_0px_var(--color-border)]'
                : 'bg-[var(--color-card)] hover:shadow-[2px_2px_0px_0px_var(--color-border)]'
            }`}
            style={{ borderWidth: '3px' }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
