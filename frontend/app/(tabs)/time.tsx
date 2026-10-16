import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Definisi tipe data timer
interface TimerItem {
  id: string;
  hours?: number;
  minutes: number;
  seconds?: number;
  restMinutes?: number;
  repeatCount: number;
  autoplay: boolean;
  isFavorite: boolean;
}

interface StopwatchLap {
  id: string;
  elapsedMs: number;
  intervalMs: number;
}

// -------------------------------------------------------------
// KOMPONEN KARTU TIMER
// -------------------------------------------------------------
interface TimerCardProps {
  hours?: number;
  minutes: number;
  seconds?: number;
  restMinutes?: number;
  isFavorite: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function limitNumericInput(value: string, max: number) {
  const digits = value.replace(/\D/g, '').slice(0, 2);
  return digits ? String(Math.min(Number(digits), max)) : '';
}

function getTimerDurationMs(timer: TimerItem) {
  return (((timer.hours ?? 0) * 60 + timer.minutes) * 60 + (timer.seconds ?? 0)) * 1000;
}

function formatClock(totalMs: number) {
  const totalSeconds = Math.ceil(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TimerCard({
  hours,
  minutes,
  seconds,
  restMinutes,
  isFavorite,
  onPress,
  onToggleFavorite,
  onEdit,
  onDelete,
}: TimerCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = isFavorite;
  const textColor = isDark ? '#FFFFFF' : '#1D2B53';
  const restColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.cardBase,
        isDark ? styles.cardFavorite : styles.cardNormal,
      ]}
    >
      <TouchableOpacity
        style={styles.timerMenuButton}
        onPress={(event) => {
          event.stopPropagation();
          setMenuOpen((open) => !open);
        }}
        activeOpacity={0.7}
        accessibilityLabel="Opsi timer"
      >
        <Ionicons name="ellipsis-vertical" size={18} color={textColor} />
      </TouchableOpacity>
      {menuOpen && (
        <View style={styles.timerMenu}>
          <TouchableOpacity
            style={styles.timerMenuItem}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onToggleFavorite?.();
            }}
          >
            <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={16} color="#D89B13" />
            <Text style={styles.timerMenuText}>{isFavorite ? 'Hapus favorit' : 'Tambah favorit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timerMenuItem}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onEdit?.();
            }}
          >
            <Ionicons name="create-outline" size={16} color="#1D2B53" />
            <Text style={styles.timerMenuText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timerMenuItem}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onDelete?.();
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#B91C1C" />
            <Text style={styles.timerDeleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.timeRow}>
        {hours !== undefined && hours > 0 && (
          <>
            <Text style={[styles.mainTimeNumber, { color: textColor }]}>
              {hours}
            </Text>
            <Text style={[styles.mainTimeUnit, { color: textColor }]}>hr </Text>
          </>
        )}
        {(minutes > 0 || (hours === undefined && !seconds)) && (
          <>
            <Text style={[styles.mainTimeNumber, { color: textColor }]}>{minutes}</Text>
            <Text style={[styles.mainTimeUnit, { color: textColor }]}>mins</Text>
          </>
        )}
        {!!seconds && seconds > 0 && (
          <>
            <Text style={[styles.mainTimeNumber, { color: textColor }]}>{seconds}</Text>
            <Text style={[styles.mainTimeUnit, { color: textColor }]}>secs</Text>
          </>
        )}
      </View>

      {restMinutes !== undefined && (
        <Text style={[styles.restText, { color: restColor }]}>
          {restMinutes} mins rest
        </Text>
      )}
    </TouchableOpacity>
  );
}

// -------------------------------------------------------------
// LAYAR UTAMA (app/time.tsx)
// -------------------------------------------------------------
export default function TimeScreen() {
  const [activeTab, setActiveTab] = useState<'timer' | 'stopwatch'>('timer');

  // State Timer
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
  const [activeTimer, setActiveTimer] = useState<TimerItem | null>(null);
  const [timerScreenVisible, setTimerScreenVisible] = useState(false);
  const [timerPhase, setTimerPhase] = useState<'work' | 'rest'>('work');
  const [timerRemainingMs, setTimerRemainingMs] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerIsFinished, setTimerIsFinished] = useState(false);
  const [timerIsWaiting, setTimerIsWaiting] = useState(false);
  const [timerAutoplay, setTimerAutoplay] = useState(true);
  const [timerRepeatCount, setTimerRepeatCount] = useState(3);
  const [timerCycle, setTimerCycle] = useState(1);
  const timerDeadlineRef = useRef<number | null>(null);

  // State Stopwatch
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

  const toggleStopwatch = () => {
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

  const resetStopwatch = () => {
    setIsRunning(false);
    startedAtRef.current = null;
    elapsedBeforeRunRef.current = 0;
    lastLapElapsedRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
  };

  const formatStopwatchTime = (totalMs: number) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatLapTime = (totalMs: number) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((totalMs % 1000) / 10);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
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

  const toggleFavorite = (id: string) => {
    setTimerList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const sortedTimers = useMemo(() => {
    return [...timerList].sort((a, b) => {
      if (a.isFavorite === b.isFavorite) return 0;
      return a.isFavorite ? -1 : 1;
    });
  }, [timerList]);

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

  const startTimer = (timer: TimerItem) => {
    setActiveTimer(timer);
    setTimerAutoplay(timer.autoplay);
    setTimerRepeatCount(timer.repeatCount);
    setTimerCycle(1);
    setTimerPhase('work');
    setTimerRemainingMs(getTimerDurationMs(timer));
    timerDeadlineRef.current = Date.now() + getTimerDurationMs(timer);
    setTimerIsFinished(false);
    setTimerIsWaiting(false);
    setTimerIsRunning(true);
    setTimerScreenVisible(true);
  };

  const startTimerPhase = (phase: 'work' | 'rest', cycle = timerCycle) => {
    if (!activeTimer) return;
    const duration = phase === 'rest'
      ? (activeTimer.restMinutes ?? 0) * 60_000
      : getTimerDurationMs(activeTimer);
    setTimerPhase(phase);
    setTimerCycle(cycle);
    setTimerRemainingMs(duration);
    timerDeadlineRef.current = Date.now() + duration;
    setTimerIsFinished(false);
    setTimerIsWaiting(false);
    setTimerIsRunning(true);
  };

  const closeTimerScreen = () => {
    setTimerIsRunning(false);
    setTimerIsWaiting(false);
    timerDeadlineRef.current = null;
    setTimerScreenVisible(false);
  };

  const restartTimerCycle = () => {
    const nextCycle = timerCycle < timerRepeatCount ? timerCycle + 1 : 1;
    startTimerPhase('work', nextCycle);
  };

  useEffect(() => {
    if (!timerIsRunning || !activeTimer) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, (timerDeadlineRef.current ?? Date.now()) - Date.now());
      setTimerRemainingMs(remaining);
      if (remaining > 0) return;

      setTimerIsRunning(false);
      if (timerPhase === 'work' && activeTimer.restMinutes) {
        const restDuration = activeTimer.restMinutes * 60_000;
        setTimerPhase('rest');
        setTimerRemainingMs(restDuration);
        if (timerAutoplay) {
          timerDeadlineRef.current = Date.now() + restDuration;
          setTimerIsRunning(true);
        } else {
          setTimerIsWaiting(true);
        }
        return;
      }

      if (timerAutoplay && timerCycle < timerRepeatCount) {
        startTimerPhase('work', timerCycle + 1);
      } else {
        setTimerIsFinished(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTimer, timerAutoplay, timerCycle, timerIsRunning, timerPhase, timerRepeatCount]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle Navigasi Atas: Timer / Stopwatch */}
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.toggleButton,
              activeTab === 'timer'
                ? styles.toggleActive
                : styles.toggleInactive,
            ]}
            onPress={() => setActiveTab('timer')}
          >
            <MaterialCommunityIcons
              name="timer-outline"
              size={24}
              color={activeTab === 'timer' ? '#FFFFFF' : '#1D2B53'}
            />
            <Text
              style={[
                styles.toggleText,
                activeTab === 'timer'
                  ? styles.toggleTextActive
                  : styles.toggleTextInactive,
              ]}
            >
              Timer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.toggleButton,
              activeTab === 'stopwatch'
                ? styles.toggleActive
                : styles.toggleInactive,
            ]}
            onPress={() => setActiveTab('stopwatch')}
          >
            <Ionicons
              name="stopwatch-outline"
              size={24}
              color={activeTab === 'stopwatch' ? '#FFFFFF' : '#1D2B53'}
            />
            <Text
              style={[
                styles.toggleText,
                activeTab === 'stopwatch'
                  ? styles.toggleTextActive
                  : styles.toggleTextInactive,
              ]}
            >
              Stopwatch
            </Text>
          </TouchableOpacity>
        </View>

        {/* Konten Berdasarkan Tab Aktif */}
        {activeTab === 'timer' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Interval Saya</Text>

            <View style={styles.gridContainer}>
              {/* Tambah Timer */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.cardBase, styles.addCard]}
                onPress={() => setAddTimerVisible(true)}
              >
                <Ionicons name="add-circle" size={48} color="#1D2B53" />
                <Text style={styles.addCardText}>Add Timer</Text>
              </TouchableOpacity>

              {/* Daftar Kartu Timer */}
              {sortedTimers.map((timer) => (
                <TimerCard
                  key={timer.id}
                  hours={timer.hours}
                  minutes={timer.minutes}
                  seconds={timer.seconds}
                  restMinutes={timer.restMinutes}
                  isFavorite={timer.isFavorite}
                  onToggleFavorite={() => toggleFavorite(timer.id)}
                  onEdit={() => editTimer(timer)}
                  onDelete={() => setTimerList((current) => current.filter((item) => item.id !== timer.id))}
                  onPress={() => startTimer(timer)}
                />
              ))}
            </View>
          </View>
        ) : (
          /* Konten Tab Stopwatch */
          <View style={styles.stopwatchWrapper}>
            <View style={styles.stopwatchTimeRow}>
              <Text style={styles.stopwatchDisplay}>{formatStopwatchTime(elapsedMs)}</Text>
              <Text style={styles.stopwatchMillis}>.{String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, '0')}</Text>
            </View>

            <View style={styles.stopwatchButtonRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.stopwatchLapButton, (!isRunning || elapsedMs === 0) && styles.stopwatchButtonDisabled]}
                onPress={markLap}
                disabled={!isRunning || elapsedMs === 0}
                accessibilityLabel="Tandai lap"
              >
                <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.stopwatchPrimaryButton}
                onPress={toggleStopwatch}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.stopwatchPrimaryButtonText}>
                  {isRunning ? 'Pause' : 'Start'}
                </Text>
              </TouchableOpacity>

              {!isRunning && elapsedMs > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.stopwatchResetButton}
                  onPress={resetStopwatch}
                >
                  <Ionicons name="reload" size={18} color="#1D2B53" />
                </TouchableOpacity>
              )}
            </View>

            {laps.length > 0 && (
              <View style={styles.lapList}>
                {laps.map((lap) => (
                  <View key={lap.id} style={styles.lapRow}>
                    <Ionicons name="flag-outline" size={15} color="#737373" />
                    <Text style={styles.lapTime}>{formatLapTime(lap.elapsedMs)}</Text>
                    <Text style={styles.lapInterval}>+{formatLapTime(lap.intervalMs)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={addTimerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAddTimer}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalDismiss}
            activeOpacity={1}
            onPress={closeAddTimer}
          />
          <View style={styles.addTimerModal}>
            <View style={styles.modalHeader}>
              {editingTimerId ? <Text style={styles.modalTitle}>Edit timer</Text> : <View />}
              <TouchableOpacity onPress={closeAddTimer} accessibilityLabel="Tutup form timer">
                <Ionicons name="close-circle" size={30} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <View style={styles.addTimerCenter}>
              <View style={styles.durationFace}>
                <TextInput
                  style={styles.durationDigit}
                  value={timerHours}
                  onChangeText={(value) => setTimerHours(limitNumericInput(value, 99))}
                  keyboardType="number-pad"
                  placeholder="00"
                  maxLength={2}
                  placeholderTextColor="#CBD5E1"
                  accessibilityLabel="Jam timer"
                />
                <Text style={styles.durationColon}>:</Text>
                <TextInput
                  style={styles.durationDigit}
                  value={timerMinutes}
                  onChangeText={(value) => setTimerMinutes(limitNumericInput(value, 59))}
                  keyboardType="number-pad"
                  placeholder="00"
                  maxLength={2}
                  placeholderTextColor="#CBD5E1"
                  accessibilityLabel="Menit timer"
                />
                <Text style={styles.durationColon}>:</Text>
                <TextInput
                  style={styles.durationDigit}
                  value={timerSeconds}
                  onChangeText={(value) => setTimerSeconds(limitNumericInput(value, 59))}
                  keyboardType="number-pad"
                  placeholder="00"
                  maxLength={2}
                  placeholderTextColor="#CBD5E1"
                  accessibilityLabel="Detik timer"
                />
              </View>
              <View style={styles.durationUnitRow}>
                <Text style={styles.durationUnitLabel}>jam</Text>
                <Text style={styles.durationUnitLabel}>menit</Text>
                <Text style={styles.durationUnitLabel}>detik</Text>
              </View>
            </View>

            <View style={styles.restToggleRow}>
              <View style={styles.restLabelGroup}>
                <Text style={styles.formLabel}>Rest period</Text>
              </View>
              <Switch
                value={hasRestPeriod}
                onValueChange={setHasRestPeriod}
                trackColor={{ false: '#CBD5E1', true: '#A9B5D0' }}
                thumbColor={hasRestPeriod ? '#1D2B53' : '#FFFFFF'}
              />
              {hasRestPeriod && (
                <TextInput
                  style={styles.restInput}
                  value={restMinutes}
                  onChangeText={(value) => setRestMinutes(limitNumericInput(value, 60))}
                  keyboardType="number-pad"
                  placeholder="0"
                  maxLength={2}
                  accessibilityLabel="Durasi rest period, maksimum 60 menit"
                />
              )}
              {hasRestPeriod && <Text style={styles.restUnit}>min</Text>}
            </View>

            {timerFormError && <Text style={styles.timerFormError}>{timerFormError}</Text>}
            <TouchableOpacity style={styles.confirmTimerButton} onPress={confirmAddTimer}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text style={styles.confirmTimerText}>{editingTimerId ? 'Save changes' : 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={timerScreenVisible}
        animationType="slide"
        onRequestClose={closeTimerScreen}
      >
        <SafeAreaView style={styles.pomodoroScreen}>
          <View style={styles.pomodoroHeader}>
            <TouchableOpacity onPress={closeTimerScreen} accessibilityLabel="Tutup timer">
              <Ionicons name="close-circle" size={30} color="#DC2626" />
            </TouchableOpacity>
            <View style={styles.repeatControls}>
              <Text style={styles.repeatLabel}>Repeat: {timerRepeatCount}</Text>
              <View style={styles.repeatStepper}>
                <TouchableOpacity
                  style={styles.repeatStepButton}
                  onPress={() => setTimerRepeatCount((count) => Math.max(1, count - 1))}
                  accessibilityLabel="Kurangi pengulangan"
                >
                  <Ionicons name="remove" size={17} color="#1D2B53" />
                </TouchableOpacity>
                <Text style={styles.repeatCycle}>{timerCycle} / {timerRepeatCount}</Text>
                <TouchableOpacity
                  style={styles.repeatStepButton}
                  onPress={() => setTimerRepeatCount((count) => Math.min(99, count + 1))}
                  accessibilityLabel="Tambah pengulangan"
                >
                  <Ionicons name="add" size={17} color="#1D2B53" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.autoplayControl}>
              <Text style={styles.autoplayLabel}>Autoplay</Text>
              <Switch
                value={timerAutoplay}
                onValueChange={(enabled) => {
                  setTimerAutoplay(enabled);
                  if (activeTimer) {
                    setTimerList((current) => current.map((timer) => (
                      timer.id === activeTimer.id ? { ...timer, autoplay: enabled } : timer
                    )));
                  }
                  if (enabled && timerIsWaiting) startTimerPhase('rest');
                }}
                trackColor={{ false: '#D4D4D4', true: '#D4D4D4' }}
                thumbColor={timerAutoplay ? '#2B3F70' : '#737373'}
              />
            </View>
          </View>

          <View style={styles.pomodoroTimerPanel}>
            {timerIsFinished ? (
              <View style={styles.pomodoroFinished}>
                <Text style={styles.pomodoroFinishedTitle}>Siklus pomodoro selesai</Text>
                <TouchableOpacity style={styles.pomodoroRestartButton} onPress={restartTimerCycle}>
                  <Ionicons name="refresh" size={20} color="#2B3F70" />
                  <Text style={styles.pomodoroRestartText}>
                    {timerCycle < timerRepeatCount ? 'Mulai siklus berikutnya' : 'Ulangi siklus'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pomodoroTimeGroup}>
                <Text style={styles.pomodoroTime}>{formatClock(timerRemainingMs)}</Text>
                {timerPhase === 'rest' && <Text style={styles.pomodoroRestTag}>Rest</Text>}
              </View>
            )}
          </View>

          {timerIsWaiting && !timerIsFinished && (
            <TouchableOpacity
              style={styles.pomodoroContinueButton}
              onPress={() => startTimerPhase('rest')}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.pomodoroContinueText}>Mulai istirahat</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.pomodoroDescription}>
            {timerIsFinished
              ? 'Kerja bagus. Siap untuk siklus berikutnya?'
              : timerPhase === 'rest'
                ? 'Enjoy your rest!'
                : activeTimer?.restMinutes
                  ? `Next, rest for ${activeTimer.restMinutes} minute(s).`
                  : 'Stay focused until the timer ends.'}
          </Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    flexGrow: 1,
  },
  tabToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  toggleButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleActive: {
    backgroundColor: '#1D2B53',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  toggleInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextInactive: {
    color: '#1D2B53',
  },
  sectionContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  cardBase: {
    width: '47.5%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFavorite: {
    backgroundColor: '#1D2B53',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  cardNormal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  timerMenuButton: { position: 'absolute', top: 9, right: 7, zIndex: 12, padding: 5 },
  timerMenu: { position: 'absolute', top: 38, right: 8, zIndex: 20, width: 118, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFFFFF', elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  timerMenuItem: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  timerMenuText: { fontSize: 13, fontWeight: '600', color: '#1D2B53' },
  timerDeleteText: { fontSize: 13, fontWeight: '600', color: '#B91C1C' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  mainTimeNumber: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainTimeUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 1,
    marginRight: 2,
  },
  restText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  addCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    gap: 8,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.42)' },
  modalDismiss: { ...StyleSheet.absoluteFill },
  addTimerModal: { width: '100%', maxWidth: 420, height: '90%', maxHeight: 680, justifyContent: 'space-between', padding: 22, borderRadius: 18, backgroundColor: '#FFFFFF', elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1D2B53' },
  formLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  addTimerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  durationFace: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  durationDigit: { width: 84, padding: 0, fontSize: 48, fontWeight: '900', textAlign: 'center', color: '#2B3F70', fontVariant: ['tabular-nums'] },
  durationColon: { marginBottom: 5, fontSize: 46, fontWeight: '800', color: '#2B3F70' },
  durationUnitRow: { width: 252, flexDirection: 'row', justifyContent: 'space-around', marginTop: 2 },
  durationUnitLabel: { width: 82, textAlign: 'center', fontSize: 11, color: '#94A3B8' },
  restToggleRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F3F4F6' },
  restLabelGroup: { flex: 1 },
  restInput: { width: 48, height: 34, borderRadius: 5, backgroundColor: '#D9D9D9', textAlign: 'center', color: '#1D2B53' },
  restUnit: { marginLeft: -5, fontSize: 11, color: '#737373' },
  timerFormError: { marginTop: 12, color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  confirmTimerButton: { width: 154, minHeight: 50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '18%', borderRadius: 12, backgroundColor: '#1D2B53' },
  confirmTimerText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pomodoroScreen: { flex: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24, backgroundColor: '#FFFFFF' },
  pomodoroHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  repeatControls: { flex: 1, alignItems: 'center' },
  repeatLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  repeatStepper: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  repeatStepButton: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#EEF1F6' },
  repeatCycle: { minWidth: 38, textAlign: 'center', fontSize: 11, color: '#64748B' },
  autoplayControl: { alignItems: 'center', gap: 2 },
  autoplayLabel: { fontSize: 11, color: '#64748B' },
  pomodoroTimerPanel: { flex: 1, minHeight: 340, maxHeight: 560, alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 14, backgroundColor: '#2B3F70' },
  pomodoroTimeGroup: { alignItems: 'center' },
  pomodoroTime: { fontSize: 54, fontWeight: '900', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  pomodoroRestTag: { marginTop: 4, fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  pomodoroFinished: { alignItems: 'center', gap: 22 },
  pomodoroFinishedTitle: { maxWidth: 280, fontSize: 25, fontWeight: '800', lineHeight: 32, color: '#FFFFFF', textAlign: 'center' },
  pomodoroRestartButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#FFFFFF' },
  pomodoroRestartText: { fontSize: 14, fontWeight: '700', color: '#2B3F70' },
  pomodoroContinueButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, borderRadius: 10, backgroundColor: '#1D2B53' },
  pomodoroContinueText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  pomodoroDescription: { minHeight: 44, marginTop: 12, fontSize: 14, color: '#2B3F70', textAlign: 'center', textAlignVertical: 'center' },

  // Stopwatch Styling
  stopwatchWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  stopwatchTimeRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 18 },
  stopwatchDisplay: {
    fontSize: 56,
    fontWeight: '900',
    color: '#1D2B53',
  },
  stopwatchMillis: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2B53',
  },
  stopwatchButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopwatchLapButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D2B53' },
  stopwatchButtonDisabled: { opacity: 0.45 },
  stopwatchPrimaryButton: {
    backgroundColor: '#1D2B53',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  stopwatchPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stopwatchResetButton: {
    backgroundColor: '#E2E8F0',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapList: { width: '100%', marginTop: 20 },
  lapRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#D4D4D4' },
  lapTime: { flex: 1, fontSize: 12, color: '#525252', fontVariant: ['tabular-nums'] },
  lapInterval: { fontSize: 12, color: '#A3A3A3', fontVariant: ['tabular-nums'] },
});