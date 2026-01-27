import React from 'react';

type ProgressProps = {
  value?: number;
  className?: string;
};

export function Progress({ value = 0, className = '' }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full h-2 rounded-full bg-slate-200 overflow-hidden ${className}`}>
      <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
    </div>
  );
}
