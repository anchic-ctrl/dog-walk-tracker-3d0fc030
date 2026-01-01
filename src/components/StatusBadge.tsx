import { ActivityStatus } from '@/types/dog';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ActivityStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    idle: {
      defaultLabel: '尚未開始',
      className: 'bg-muted text-muted-foreground',
    },
    active: {
      defaultLabel: '進行中',
      className: 'bg-status-walking text-foreground animate-pulse-soft',
    },
    finished: {
      defaultLabel: '已完成',
      className: 'bg-status-finished text-foreground',
    },
  };

  const { defaultLabel, className } = config[status];

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      className
    )}>
      {label || defaultLabel}
    </span>
  );
}
