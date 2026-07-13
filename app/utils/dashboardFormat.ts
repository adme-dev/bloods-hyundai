// Pure display helpers for the admin dashboard, shared by the page and the
// section components under app/components/admin/dashboard/.

import { ENQUIRY_STATUS_CONFIG, type EnquiryStatus } from '~~/shared/constants/salesFunnel';

export function getTrendClass(change: number | undefined): string {
  if (!change) return 'text-muted-foreground';
  return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
}

export function formatTrend(change: number | undefined): string {
  if (!change) return '0%';
  return `${change > 0 ? '+' : ''}${change}%`;
}

export function formatResponseTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  return `${Math.round(hours / 24)}d`;
}

export function getConversionBarClass(rate: number): string {
  if (rate >= 70) return 'bg-green-500';
  if (rate >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function formatChartDate(date: string): string {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return date;
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[monthIndex] || ''}`.trim();
}

export function formatAdminDate(date: string): string {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return date;
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[monthIndex];
  return month ? `${day} ${month} ${match[1]}` : date;
}

export function formatTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Canonical funnel vocabulary (the previous local maps still used the retired
// new/in_progress/contacted/closed set, so real statuses rendered raw).
export function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const stage = ENQUIRY_STATUS_CONFIG[status as EnquiryStatus]?.stage;
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    cold: 'secondary',
    warm: 'default',
    hot: 'default',
    closed: status === 'lost' ? 'destructive' : 'outline',
  };
  return (stage && map[stage]) || 'outline';
}

export function formatStatus(status: string): string {
  return ENQUIRY_STATUS_CONFIG[status as EnquiryStatus]?.label || status;
}

export function getDashboardInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDashboardCurrency(value: number | undefined): string {
  if (!value || isNaN(value)) return '0';
  return value.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

export function getTargetProgress(current: number | undefined, target: number | undefined): number {
  if (!current || !target) return 0;
  return Math.round((current / target) * 100);
}

export function getTargetProgressClass(current: number | undefined, target: number | undefined): string {
  const progress = getTargetProgress(current, target);
  if (progress >= 100) return 'text-green-600 font-semibold';
  if (progress >= 75) return 'text-blue-600';
  if (progress >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getLeadScoreClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-400';
}

export function getWorkloadBorderClass(level: string): string {
  const classes: Record<string, string> = {
    low: 'border-green-200 dark:border-green-900',
    moderate: 'border-blue-200 dark:border-blue-900',
    high: 'border-yellow-200 dark:border-yellow-900',
    overloaded: 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20',
  };
  return classes[level] || '';
}

export function getWorkloadBadgeVariant(level: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    low: 'outline',
    moderate: 'secondary',
    high: 'default',
    overloaded: 'destructive',
  };
  return variants[level] || 'outline';
}

export function getDeptBgClass(color: string): string {
  const classes: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-950',
    gray: 'bg-gray-100 dark:bg-gray-800',
    green: 'bg-green-100 dark:bg-green-950',
    orange: 'bg-orange-100 dark:bg-orange-950',
    purple: 'bg-purple-100 dark:bg-purple-950',
    cyan: 'bg-cyan-100 dark:bg-cyan-950',
    yellow: 'bg-yellow-100 dark:bg-yellow-950',
    pink: 'bg-pink-100 dark:bg-pink-950',
    indigo: 'bg-indigo-100 dark:bg-indigo-950',
  };
  return classes[color] || 'bg-muted';
}

export function getDeptTextClass(color: string): string {
  const classes: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    gray: 'text-gray-600 dark:text-gray-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    pink: 'text-pink-600 dark:text-pink-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };
  return classes[color] || 'text-muted-foreground';
}
