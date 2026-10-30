import { useMemo, useState } from 'react';
import type { ScheduleBlockType, TaskType } from '@/lib/types';
import { toDateKey } from '@/lib/calendarUtils';
import { taskOccursOnDate } from '@/lib/taskRecurrence';
import { useAppTheme } from '@/theme/ThemeProvider';

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function useCalendarNavigation(
  tasks: TaskType[],
  scheduleBlocks: ScheduleBlockType[],
  searchQuery: string,
) {
  const { colors } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(toDateKey(new Date()));
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(new Date().getFullYear() / 10) * 10);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};
    const displayedMonth = new Date(`${calendarMonth.slice(0, 7)}-01T12:00:00`);
    const firstVisibleDate = new Date(displayedMonth);
    firstVisibleDate.setDate(displayedMonth.getDate() - displayedMonth.getDay());
    const visibleDates = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisibleDate);
      date.setDate(firstVisibleDate.getDate() + index);
      return toDateKey(date);
    });

    tasks.forEach((task) => {
      visibleDates.forEach((date) => {
        if (!taskOccursOnDate(task, date)) return;
        marks[date] = {
          marked: true,
          dotColor: marks[date]?.dotColor ?? (task.isTodo ? colors.primary : colors.success),
        };
      });
    });
    scheduleBlocks.forEach((block) => {
      marks[block.date] = {
        marked: true,
        dotColor: marks[block.date]?.dotColor ?? block.color,
      };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? { marked: false, dotColor: colors.primary }),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [calendarMonth, colors.primary, colors.success, scheduleBlocks, selectedDate, tasks]);

  const dayTasks = tasks.filter((task) => taskOccursOnDate(task, selectedDate));
  const weekDates = useMemo(() => {
    const monday = new Date(`${selectedDate}T12:00:00`);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return toDateKey(date);
    });
  }, [selectedDate]);
  const weekLabel = `${new Date(`${weekDates[0]}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(`${weekDates[6]}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const todayDate = toDateKey(new Date());
  const matchingEvents = tasks.filter((task) => (
    task.dueDate && task.detail.toLowerCase().includes(searchQuery.trim().toLowerCase())
  ));

  const goToDate = (date: string) => {
    setSelectedDate(date);
    setCalendarMonth(date);
  };

  const openMonthPicker = () => {
    const visibleDate = new Date(`${calendarMonth}T12:00:00`);
    const year = visibleDate.getFullYear();
    setPickerYear(year);
    setYearRangeStart(Math.floor(year / 10) * 10);
    setMonthPickerVisible(true);
  };

  const selectCalendarEvent = (task: TaskType, onCloseSearch: () => void) => {
    if (!task.dueDate) return;
    goToDate(task.dueDate);
    onCloseSearch();
  };

  const selectMonth = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, '0');
    const selectedDay = Number(selectedDate.slice(8, 10));
    const lastDay = new Date(Date.UTC(pickerYear, monthIndex + 1, 0)).getUTCDate();
    const date = `${pickerYear}-${month}-${String(Math.min(selectedDay, lastDay)).padStart(2, '0')}`;
    goToDate(date);
    setMonthPickerVisible(false);
  };

  return {
    selectedDate,
    setSelectedDate,
    calendarMonth,
    setCalendarMonth,
    markedDates,
    dayTasks,
    weekDates,
    weekLabel,
    todayDate,
    matchingEvents,
    monthPickerVisible,
    setMonthPickerVisible,
    pickerYear,
    setPickerYear,
    yearRangeStart,
    setYearRangeStart,
    goToDate,
    openMonthPicker,
    selectCalendarEvent,
    selectMonth,
    monthNames: MONTH_NAMES,
  };
}
