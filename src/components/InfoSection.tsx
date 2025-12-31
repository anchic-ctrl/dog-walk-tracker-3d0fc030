import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InfoSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'warning';
}

export function InfoSection({ title, icon, children, className, variant = 'default' }: InfoSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl p-4',
        variant === 'default' && 'bg-card border',
        variant === 'warning' && 'bg-warning-bg border border-warning/30',
        className
      )}
    >
      <h3 className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
