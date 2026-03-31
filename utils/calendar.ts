import { FirstDayOfWeek } from '@/types/task';
import { toDayKey } from '@/utils/date';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_INDEX: Record<FirstDayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function getWeekdayLabels(firstDayOfWeek: FirstDayOfWeek) {
  const start = START_INDEX[firstDayOfWeek];
  return Array.from({ length: 7 }, (_, index) => WEEKDAYS[(start + index) % 7]);
}

export function getMonthGrid(currentMonth: Date, firstDayOfWeek: FirstDayOfWeek) {
  const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startIndex = START_INDEX[firstDayOfWeek];
  const offset = (firstOfMonth.getDay() - startIndex + 7) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      key: toDayKey(date),
      inCurrentMonth: date.getMonth() === currentMonth.getMonth(),
    };
  });
}
