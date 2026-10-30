import { useMemo, useState } from 'react';
import type { TimerItem } from '@/components/time/TimerCard';

export function useTimerLibrary() {
  const [timerList, setTimerList] = useState<TimerItem[]>([
    { id: '1', minutes: 25, restMinutes: 5, repeatCount: 3, autoplay: true, isFavorite: true },
    { id: '2', minutes: 15, restMinutes: 5, repeatCount: 3, autoplay: true, isFavorite: false },
    { id: '3', hours: 1, minutes: 45, repeatCount: 3, autoplay: true, isFavorite: false },
  ]);
  const [addTimerVisible, setAddTimerVisible] = useState(false);
  const [timerHours, setTimerHours] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState('');
  const [hasRestPeriod, setHasRestPeriod] = useState(false);
  const [restMinutes, setRestMinutes] = useState('');
  const [timerFormError, setTimerFormError] = useState<string | null>(null);
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null);

  const sortedTimers = useMemo(() => {
    return [...timerList].sort((a, b) => {
      if (a.isFavorite === b.isFavorite) return 0;
      return a.isFavorite ? -1 : 1;
    });
  }, [timerList]);

  const toggleFavorite = (id: string) => {
    setTimerList((prev) => prev.map((item) => (
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )));
  };

  const closeAddTimer = () => {
    setAddTimerVisible(false);
    setEditingTimerId(null);
    setTimerHours('');
    setTimerMinutes('');
    setTimerSeconds('');
    setHasRestPeriod(false);
    setRestMinutes('');
    setTimerFormError(null);
  };

  const editTimer = (timer: TimerItem) => {
    setEditingTimerId(timer.id);
    setTimerHours(String(timer.hours ?? 0));
    setTimerMinutes(String(timer.minutes));
    setTimerSeconds(String(timer.seconds ?? 0));
    setHasRestPeriod(timer.restMinutes !== undefined);
    setRestMinutes(String(timer.restMinutes ?? ''));
    setTimerFormError(null);
    setAddTimerVisible(true);
  };

  const confirmAddTimer = () => {
    const hours = Number(timerHours) || 0;
    const minutes = Number(timerMinutes) || 0;
    const seconds = Number(timerSeconds) || 0;
    const rest = Number(restMinutes) || 0;

    if (hours === 0 && minutes === 0 && seconds === 0) {
      setTimerFormError('Masukkan durasi timer.');
      return;
    }
    if (hasRestPeriod && rest === 0) {
      setTimerFormError('Masukkan durasi rest period.');
      return;
    }

    const timerChanges = {
      hours: hours || undefined,
      minutes,
      seconds,
      restMinutes: hasRestPeriod ? rest : undefined,
    };
    setTimerList((current) => editingTimerId
      ? current.map((timer) => (
        timer.id === editingTimerId ? { ...timer, ...timerChanges } : timer
      ))
      : [...current, {
        id: String(Date.now()),
        ...timerChanges,
        repeatCount: 3,
        autoplay: true,
        isFavorite: false,
      }]);
    closeAddTimer();
  };

  return {
    timerList,
    setTimerList,
    sortedTimers,
    addTimerVisible,
    setAddTimerVisible,
    timerHours,
    setTimerHours,
    timerMinutes,
    setTimerMinutes,
    timerSeconds,
    setTimerSeconds,
    hasRestPeriod,
    setHasRestPeriod,
    restMinutes,
    setRestMinutes,
    timerFormError,
    editingTimerId,
    toggleFavorite,
    closeAddTimer,
    editTimer,
    confirmAddTimer,
  };
}
