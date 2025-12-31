import { cn } from '@/lib/utils';
import { AlertTriangle, Check } from 'lucide-react';

interface WarningTagProps {
  label: string;
  active: boolean;
  variant?: 'warning' | 'neutral';
}

export function WarningTag({ label, active, variant = 'warning' }: WarningTagProps) {
  if (!active && variant === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-finished-bg text-status-finished text-sm font-medium">
        <Check className="w-4 h-4" />
        {label}: No
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
        active
          ? 'bg-warning-bg text-warning-foreground'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {active && <AlertTriangle className="w-4 h-4 text-warning" />}
      {label}: {active ? 'Yes' : 'No'}
    </span>
  );
}
