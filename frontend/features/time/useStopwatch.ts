import { useEffect, useRef, useState } from 'react';
import type { StopwatchLap } from '@/components/time/StopwatchPanel';

export function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<StopwatchLap[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforeRunRef = useRef(0);
  const lastLapElapsedRef = useRef(0);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (startedAtRef.current !== null) {
          setElapsedMs(elapsedBeforeRunRef.current + Date.now() - startedAtRef.current);
        }
      }, 16);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggle = () => {
    if (isRunning) {
      const now = Date.now();
      const elapsed = elapsedBeforeRunRef.current + now - (startedAtRef.current ?? now);
      elapsedBeforeRunRef.current = elapsed;
      startedAtRef.current = null;
      setElapsedMs(elapsed);
      setIsRunning(false);
      return;
    }

    startedAtRef.current = Date.now();
    setIsRunning(true);
  };

  const reset = () => {
    setIsRunning(false);
    startedAtRef.current = null;
    elapsedBeforeRunRef.current = 0;
    lastLapElapsedRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
  };

  const markLap = () => {
    if (!isRunning || startedAtRef.current === null) return;
    const lapTime = elapsedBeforeRunRef.current + Date.now() - startedAtRef.current;
    const intervalMs = lapTime - lastLapElapsedRef.current;
    lastLapElapsedRef.current = lapTime;
    setElapsedMs(lapTime);
    setLaps((current) => [
      { id: `${lapTime}-${current.length}`, elapsedMs: lapTime, intervalMs },
      ...current,
    ]);
  };

  return { elapsedMs, laps, isRunning, toggle, reset, markLap };
}
