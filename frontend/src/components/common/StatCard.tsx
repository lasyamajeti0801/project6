import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  link?: string;
  sublabel?: string;
  accentColor?: 'forest' | 'amber' | 'terracotta' | 'alert' | 'sage';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  isPositive,
  icon,
  link,
  sublabel,
  accentColor = 'forest',
}) => {
  const accentClasses = {
    forest: 'bg-emerald-subtle text-forest dark:bg-emerald/10 dark:text-accent',
    amber: 'bg-amber-subtle text-amber-warm dark:bg-amber/10 dark:text-amber',
    terracotta: 'bg-terracotta-subtle text-terracotta dark:bg-terracotta/10 dark:text-orange-300',
    alert: 'bg-alert-subtle text-alert dark:bg-alert/10 dark:text-red-400',
    sage: 'bg-sage-100 text-forest-dark dark:bg-sage-800/40 dark:text-sage-100',
  };

  const cardContent = (
    <div className="p-5 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700/80 rounded-xl shadow-soft hover:shadow-card hover:border-forest/40 dark:hover:border-accent/40 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-textMuted dark:text-charcoal-200 tracking-wide uppercase">
            {label}
          </span>
          <div className="text-2xl font-bold text-charcoal-900 dark:text-white mt-1.5 tracking-tight group-hover:text-forest dark:group-hover:text-accent transition-colors">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${accentClasses[accentColor]}`}>
          {icon}
        </div>
      </div>

      {(change || sublabel) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-textMuted dark:text-charcoal-200 pt-3 border-t border-charcoal-100 dark:border-charcoal-700/60">
          {change && (
            <span
              className={`inline-flex items-center font-medium ${
                isPositive ? 'text-forest dark:text-accent' : 'text-alert dark:text-red-400'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {change}
            </span>
          )}
          {sublabel && <span>{sublabel}</span>}
        </div>
      )}
    </div>
  );

  return link ? <Link to={link}>{cardContent}</Link> : cardContent;
};
