import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700/80 rounded-xl shadow-card transition-colors duration-200 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-100 dark:border-charcoal-700/60">
          <div>
            {title && (
              <h3 className="font-semibold text-charcoal-900 dark:text-white text-base">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};
