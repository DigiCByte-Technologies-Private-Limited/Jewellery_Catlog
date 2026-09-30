import React from 'react';
import { cn } from './Button';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gold';
}

export function Badge({ className, variant = 'info', children, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    gold: 'bg-gold-100 text-gold-800'
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
