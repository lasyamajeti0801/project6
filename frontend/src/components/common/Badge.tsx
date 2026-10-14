import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'sage' | 'neutral' | 'terracotta';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const variantStyles = {
    success: 'bg-emerald-subtle text-forest border border-emerald/20 dark:bg-emerald/10 dark:text-accent',
    warning: 'bg-amber-subtle text-amber-warm border border-amber/30 dark:bg-amber/10 dark:text-amber',
    danger: 'bg-alert-subtle text-alert border border-alert/20 dark:bg-alert/10 dark:text-red-400',
    sage: 'bg-sage-100 text-forest-dark border border-sage-200 dark:bg-sage-800/40 dark:text-sage-100',
    terracotta: 'bg-terracotta-subtle text-terracotta border border-terracotta/20 dark:bg-terracotta/10 dark:text-orange-300',
    neutral: 'bg-charcoal-100 text-charcoal-800 border border-charcoal-200 dark:bg-charcoal-800 dark:text-charcoal-200 dark:border-charcoal-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tracking-wide uppercase ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
