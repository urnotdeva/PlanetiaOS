import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'icon';
};

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none';

  const variants: Record<string, string> = {
    default: 'bg-emerald-500 hover:bg-green-400 text-white',
    ghost: 'bg-transparent hover:bg-green-100 text-slate-700',
    outline: 'border border-slate-200 bg-white hover:bg-green-50 text-slate-700'
  };

  const sizes: Record<string, string> = {
    default: 'h-11 px-4 py-2',
    icon: 'h-11 w-11'
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
