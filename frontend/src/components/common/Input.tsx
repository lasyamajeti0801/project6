import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefixIcon, suffixIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
            {label}
            {props.required && <span className="text-alert ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 text-textMuted pointer-events-none">
              {prefixIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-white dark:bg-charcoal-900/60 text-charcoal-900 dark:text-white px-3.5 py-2 text-sm transition-all placeholder:text-charcoal-700 ${
              prefixIcon ? 'pl-9' : ''
            } ${suffixIcon ? 'pr-9' : ''} ${
              error
                ? 'border-alert focus:border-alert focus:ring-1 focus:ring-alert/30'
                : 'border-charcoal-200 dark:border-charcoal-700 focus:border-forest focus:ring-1 focus:ring-forest/30 dark:focus:border-accent'
            } ${className}`}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-3 text-textMuted">
              {suffixIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-alert mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-textMuted dark:text-charcoal-200 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
