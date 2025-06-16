/**
 * Format a date into a readable string
 * @param date The date to format
 * @returns A formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Calculate the difference between two dates in days
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days between dates
 */
export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Add days to a date
 * @param date The date to add days to
 * @param days Number of days to add
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}; 