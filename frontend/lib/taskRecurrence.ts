import type { TaskType } from './types';

function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day, date };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function taskOccursOnDate(task: TaskType, dateKey: string) {
  if (!task.dueDate) return false;
  if (task.dueDate === dateKey) return true;
  if (!task.repeatTask) return false;

  const start = parseDateKey(task.dueDate);
  const occurrence = parseDateKey(dateKey);
  if (!start || !occurrence || occurrence.date < start.date) return false;

  switch (task.repeatEvery) {
    case 'weekly': {
      const daysSinceStart = (occurrence.date.getTime() - start.date.getTime()) / 86_400_000;
      return daysSinceStart % 7 === 0;
    }
    case 'monthly': {
      const monthsSinceStart = (occurrence.year - start.year) * 12 + occurrence.month - start.month;
      const expectedDay = Math.min(start.day, daysInMonth(occurrence.year, occurrence.month));
      return monthsSinceStart > 0 && occurrence.day === expectedDay;
    }
    case 'yearly': {
      const expectedDay = Math.min(start.day, daysInMonth(occurrence.year, start.month));
      return occurrence.year > start.year
        && occurrence.month === start.month
        && occurrence.day === expectedDay;
    }
    default:
      return false;
  }
}
