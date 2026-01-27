import React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
      {...props}
    />
  );
}
