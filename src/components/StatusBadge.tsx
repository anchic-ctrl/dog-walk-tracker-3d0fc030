import { WalkStatus } from '@/types/dog';
import { cn } from '@/lib/utils';
import { Circle, Play, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: WalkStatus;
  className?: string;
}

const statusConfig = {
  idle: {
    label: '尚未開始',
    icon: Circle,
    className: 'bg-status-idle-bg text-status-idle',
  },
  walking: {
    label: '散步中',
    icon: Play,
    className: 'bg-status-walking-bg text-status-walking animate-pulse-soft',
  },
  finished: {
    label: '本輪已完成',
    icon: CheckCircle,
    className: 'bg-status-finished-bg text-status-finished',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
