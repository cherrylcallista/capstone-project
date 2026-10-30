import { useEffect, useRef, useState } from 'react';
import { getTimerDurationMs, type TimerItem } from '@/components/time/TimerCard';

export function usePomodoroTimer() {
  const [activeTimer, setActiveTimer] = useState<TimerItem | null>(null);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [remainingMs, setRemainingMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [repeatCount, setRepeatCount] = useState(3);
  const [cycle, setCycle] = useState(1);
  const deadlineRef = useRef<number | null>(null);

  const startPhase = (nextPhase: 'work' | 'rest', nextCycle = cycle) => {
    if (!activeTimer) return;
    const duration = nextPhase === 'rest'
      ? (activeTimer.restMinutes ?? 0) * 60_000
      : getTimerDurationMs(activeTimer);
    setPhase(nextPhase);
    setCycle(nextCycle);
    setRemainingMs(duration);
    deadlineRef.current = Date.now() + duration;
    setIsFinished(false);
    setIsWaiting(false);
    setIsRunning(true);
  };

  const start = (timer: TimerItem) => {
    const duration = getTimerDurationMs(timer);
    setActiveTimer(timer);
    setAutoplay(timer.autoplay);
    setRepeatCount(timer.repeatCount);
    setCycle(1);
    setPhase('work');
    setRemainingMs(duration);
    deadlineRef.current = Date.now() + duration;
    setIsFinished(false);
    setIsWaiting(false);
    setIsRunning(true);
    setVisible(true);
  };

  const close = () => {
    setIsRunning(false);
    setIsWaiting(false);
    deadlineRef.current = null;
    setVisible(false);
  };

  const restartCycle = () => {
    startPhase('work', cycle < repeatCount ? cycle + 1 : 1);
  };

  useEffect(() => {
    if (!isRunning || !activeTimer) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, (deadlineRef.current ?? Date.now()) - Date.now());
      setRemainingMs(remaining);
      if (remaining > 0) return;

      setIsRunning(false);
      if (phase === 'work' && activeTimer.restMinutes) {
        const restDuration = activeTimer.restMinutes * 60_000;
        setPhase('rest');
        setRemainingMs(restDuration);
        if (autoplay) {
          deadlineRef.current = Date.now() + restDuration;
          setIsRunning(true);
        } else {
          setIsWaiting(true);
        }
        return;
      }

      if (autoplay && cycle < repeatCount) {
        startPhase('work', cycle + 1);
      } else {
        setIsFinished(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTimer, autoplay, cycle, isRunning, phase, repeatCount]);

  return {
    activeTimer,
    visible,
    phase,
    remainingMs,
    isRunning,
    isFinished,
    isWaiting,
    autoplay,
    repeatCount,
    cycle,
    setAutoplay,
    setRepeatCount,
    start,
    startPhase,
    close,
    restartCycle,
  };
}
