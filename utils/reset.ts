import { ResetInterval, FirstDayOfWeek } from '@/types/task';

function getStartOfWeek(date: Date, firstDay: FirstDayOfWeek): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const dayMap: Record<FirstDayOfWeek, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  };
  const target = dayMap[firstDay];
  const diff = (day < target ? 7 : 0) + day - target;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function shouldResetTasks(
  interval: ResetInterval,
  lastResetAt: string | null,
  firstDayOfWeek: FirstDayOfWeek = 'sunday',
  now = Date.now()
) {
  if (interval === 'none') return false;
  if (!lastResetAt) return true;

  const lastDate = new Date(lastResetAt);
  const nowDate = new Date(now);

  // If time went backwards (e.g. system clock change), don't reset
  if (nowDate <= lastDate) return false;

  switch (interval) {
    case 'daily':
      return nowDate.toDateString() !== lastDate.toDateString();
    
    case 'weekly':
      return getStartOfWeek(nowDate, firstDayOfWeek) > getStartOfWeek(lastDate, firstDayOfWeek);
    
    case 'monthly':
      return (
        nowDate.getMonth() !== lastDate.getMonth() || 
        nowDate.getFullYear() !== lastDate.getFullYear()
      );
    
    case 'yearly':
      return nowDate.getFullYear() !== lastDate.getFullYear();
    
    default:
      return false;
  }
}

export function formatRelativeResetLabel(interval: ResetInterval) {
  switch (interval) {
    case 'daily':
      return 'Every new day';
    case 'weekly':
      return 'Every new week';
    case 'monthly':
      return 'Every new month';
    case 'yearly':
      return 'Every new year';
    default:
      return 'Never';
  }
}
