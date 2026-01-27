import * as React from 'react';

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className = '' }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={
          `relative inline-flex h-7 w-14 items-center rounded-full border-2 shadow-lg transition-colors ` +
          (checked
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400'
            : 'bg-gray-300 border-gray-400') +
          (disabled ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer') +
          ` ${className}`
        }
      >
        <span
          className={
            `absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white shadow-xl transition-transform ` +
            (checked ? 'translate-x-7' : 'translate-x-0')
          }
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };