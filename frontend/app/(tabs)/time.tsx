import React, { useState } from 'react';
import { TimeModeContent } from '@/components/time/TimeModeContent';
import { RunningTimerModal } from '@/components/time/RunningTimerModal';
import { TimerSetupModal } from '@/components/time/TimerSetupModal';
import { usePomodoroTimer } from '@/features/time/usePomodoroTimer';
import { useStopwatch } from '@/features/time/useStopwatch';
import { useTimerLibrary } from '@/features/time/useTimerLibrary';

// -------------------------------------------------------------
// LAYAR UTAMA (app/time.tsx)
// -------------------------------------------------------------
export default function TimeScreen() {
  const [activeTab, setActiveTab] = useState<'timer' | 'stopwatch'>('timer');

  const {
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
  } = useTimerLibrary();
  const pomodoro = usePomodoroTimer();
  const {
    activeTimer,
    visible: timerScreenVisible,
    phase: timerPhase,
    remainingMs: timerRemainingMs,
    isFinished: timerIsFinished,
    isWaiting: timerIsWaiting,
    autoplay: timerAutoplay,
    repeatCount: timerRepeatCount,
    cycle: timerCycle,
    setAutoplay: setTimerAutoplay,
    setRepeatCount: setTimerRepeatCount,
    start: startTimer,
    startPhase: startTimerPhase,
    close: closeTimerScreen,
    restartCycle: restartTimerCycle,
  } = pomodoro;

  const {
    elapsedMs,
    laps,
    isRunning,
    toggle: toggleStopwatch,
    reset: resetStopwatch,
    markLap,
  } = useStopwatch();

  return (
    <>
      <TimeModeContent
        activeTab={activeTab}
        timers={sortedTimers}
        elapsedMs={elapsedMs}
        isRunning={isRunning}
        laps={laps}
        onSelectTab={setActiveTab}
        onAddTimer={() => setAddTimerVisible(true)}
        onToggleFavorite={toggleFavorite}
        onEditTimer={editTimer}
        onDeleteTimer={(id) => setTimerList((current) => current.filter((timer) => timer.id !== id))}
        onStartTimer={startTimer}
        onMarkLap={markLap}
        onToggleStopwatch={toggleStopwatch}
        onResetStopwatch={resetStopwatch}
      />
      <TimerSetupModal
        visible={addTimerVisible}
        isEditing={editingTimerId !== null}
        hours={timerHours}
        minutes={timerMinutes}
        seconds={timerSeconds}
        hasRestPeriod={hasRestPeriod}
        restMinutes={restMinutes}
        error={timerFormError}
        onHoursChange={setTimerHours}
        onMinutesChange={setTimerMinutes}
        onSecondsChange={setTimerSeconds}
        onHasRestChange={setHasRestPeriod}
        onRestMinutesChange={setRestMinutes}
        onClose={closeAddTimer}
        onConfirm={confirmAddTimer}
      />
      <RunningTimerModal
        visible={timerScreenVisible}
        activeTimer={activeTimer}
        phase={timerPhase}
        remainingMs={timerRemainingMs}
        isFinished={timerIsFinished}
        isWaiting={timerIsWaiting}
        autoplay={timerAutoplay}
        repeatCount={timerRepeatCount}
        cycle={timerCycle}
        onClose={closeTimerScreen}
        onRepeatCountChange={setTimerRepeatCount}
        onAutoplayChange={(enabled) => {
          setTimerAutoplay(enabled);
          if (activeTimer) {
            setTimerList((current) => current.map((timer) => (
              timer.id === activeTimer.id ? { ...timer, autoplay: enabled } : timer
            )));
          }
          if (enabled && timerIsWaiting) startTimerPhase('rest');
        }}
        onContinueRest={() => startTimerPhase('rest')}
        onRestartCycle={restartTimerCycle}
      />
    </>
  );
}