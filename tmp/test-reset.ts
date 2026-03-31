import { shouldResetTasks } from '../utils/reset';
import { ResetInterval, FirstDayOfWeek } from '../types/task';

function test() {
  const now = new Date('2026-03-29T10:00:00Z').getTime(); // A Sunday
  const lastResetSameDay = '2026-03-29T02:00:00Z';
  const lastResetPrevDay = '2026-03-28T23:59:59Z';

  console.log('--- Daily Tests ---');
  console.log('Same day:', shouldResetTasks('daily', lastResetSameDay, 'sunday', now)); // Expected: false
  console.log('Prev day:', shouldResetTasks('daily', lastResetPrevDay, 'sunday', now)); // Expected: true

  console.log('\n--- Weekly Tests (First day: Sunday) ---');
  const lastResetPrevWeekSun = '2026-03-22T10:00:00Z';
  const lastResetThisWeekSat = '2026-03-28T10:00:00Z';
  console.log('Prev week:', shouldResetTasks('weekly', lastResetPrevWeekSun, 'sunday', now)); // Expected: true
  console.log('This week (Sat):', shouldResetTasks('weekly', lastResetThisWeekSat, 'sunday', now)); // Expected: true (Wait, Sat to Sun is a week boundary if Sun is first day)
  
  const lastResetThisWeekTue = '2026-03-24T10:00:00Z';
  console.log('This week (Tue):', shouldResetTasks('weekly', lastResetThisWeekTue, 'sunday', now)); // Expected: true

  console.log('\n--- Monthly Tests ---');
  const lastResetPrevMonth = '2026-02-28T10:00:00Z';
  const lastResetThisMonth = '2026-03-01T10:00:00Z';
  console.log('Prev month:', shouldResetTasks('monthly', lastResetPrevMonth, 'sunday', now)); // Expected: true
  console.log('This month:', shouldResetTasks('monthly', lastResetThisMonth, 'sunday', now)); // Expected: false
}

test();
