import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 mb-1.5">
            {label}
            {props.required && <span className="text-alert ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full rounded-lg border bg-white dark:bg-charcoal-900/60 text-charcoal-900 dark:text-white px-3.5 py-2 text-sm transition-all border-charcoal-200 dark:border-charcoal-700 focus:border-forest focus:ring-1 focus:ring-forest/30 dark:focus:border-accent ${
            error ? 'border-alert' : ''
          } ${className}`}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-xs text-alert mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-textMuted dark:text-charcoal-200 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
