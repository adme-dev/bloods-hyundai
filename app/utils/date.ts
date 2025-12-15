/**
 * Check if current date is within a date range
 * Used for promotional content, tickers, etc.
 */
export function isDateInRange(start?: string | Date, end?: string | Date): boolean {
  const now = new Date();
  
  // If no dates provided, always show
  if (!start && !end) return true;
  
  // Parse dates
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  
  // Check start date
  if (startDate && now < startDate) return false;
  
  // Check end date
  if (endDate && now > endDate) return false;
  
  return true;
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return d.toLocaleDateString('en-AU', defaultOptions);
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}







