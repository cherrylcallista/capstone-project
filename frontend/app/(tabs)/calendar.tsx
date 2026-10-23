import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { TaskForm } from '@/components/TaskForm';
import {
  fetchTaskCategories,
  fetchScheduleBlocks,
  fetchTasks,
  loadCachedCategories,
  loadCachedScheduleBlocks,
  loadCachedTasks,
  removeScheduleBlock,
  saveScheduleBlock,
  subscribeToLocalDataChanges,
  updateTask,
} from '@/lib/api';
import type { ScheduleBlockType, TaskType } from '@/lib/types';

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function upsertTask(tasks: TaskType[], updatedTask: TaskType) {
  const existingIndex = tasks.findIndex((task) => (
    (updatedTask.clientId && task.clientId === updatedTask.clientId)
    || task.id === updatedTask.id
  ));
  if (existingIndex < 0) return [...tasks, updatedTask];
  return tasks.map((task, index) => index === existingIndex ? updatedTask : task);
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const SCHEDULE_COLORS = ['#587B8A', '#D88978', '#8E78A8', '#57927D', '#C99A48', '#4E77B8'];
const HOUR_LABEL_WIDTH = 52;
const DAY_COLUMN_WIDTH = 96;
const HOUR_ROW_HEIGHT = 52;
const HALF_HOUR_HEIGHT = HOUR_ROW_HEIGHT / 2;

function getHourFromOffset(offsetY: number) {
  return Math.min(23.5, Math.max(0, Math.floor(offsetY / HALF_HOUR_HEIGHT) / 2));
}

function formatTime(hour: number) {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function formatDuration(hours: number) {
  if (hours % 1 === 0) return `${hours} jam`;
  const wholeHours = Math.floor(hours);
  return wholeHours > 0 ? `${wholeHours} jam 30 menit` : '30 menit';
}

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlockType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeblock'>('calendar');
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(toDateKey(new Date()));
  const [formVisible, setFormVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(new Date().getFullYear() / 10) * 10);
  const [blockEditorVisible, setBlockEditorVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlockType | null>(null);
  const [blockDraftSlot, setBlockDraftSlot] = useState<{ date: string; hour: number } | null>(null);
  const [blockLabel, setBlockLabel] = useState('');
  const [blockColor, setBlockColor] = useState(SCHEDULE_COLORS[0]);
  const [blockDurationHours, setBlockDurationHours] = useState(1);
  const [blockEditorError, setBlockEditorError] = useState('');
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [dragSelection, setDragSelection] = useState<{
    date: string;
    startHour: number;
    endHour: number;
  } | null>(null);
  const dragStartHourRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchTasks()
        .then((updatedTasks) => {
          if (isActive) setTasks(updatedTasks);
        })
        .catch((error) => {
          console.error('Failed to read cached tasks:', error);
        });
      const unsubscribe = subscribeToLocalDataChanges(() => {
        loadCachedTasks()
          .then((updatedTasks) => {
            if (isActive) setTasks(updatedTasks);
          })
          .catch((error) => console.error('Failed to refresh cached tasks:', error));
        loadCachedCategories()
          .then((updatedCategories) => {
            if (isActive) setCategories(updatedCategories);
          })
          .catch((error) => console.error('Failed to refresh cached categories:', error));
        loadCachedScheduleBlocks()
          .then((updatedBlocks) => {
            if (isActive) setScheduleBlocks(updatedBlocks);
          })
          .catch((error) => console.error('Failed to refresh cached schedule blocks:', error));
      });

      return () => {
        isActive = false;
        unsubscribe();
      };
    }, []),
  );

  useEffect(() => {
    fetchTaskCategories()
      .then(setCategories)
      .catch((error) => console.error('Failed to read cached categories:', error));
    fetchScheduleBlocks()
      .then(setScheduleBlocks)
      .catch((error) => console.error('Failed to load cached schedule blocks:', error));
  }, []);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        marks[task.dueDate] = { marked: true, dotColor: task.isTodo ? '#1D2B53' : '#10B981' };
      }
    });
    scheduleBlocks.forEach((block) => {
      marks[block.date] = { marked: true, dotColor: block.color };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? { marked: false, dotColor: '#1D2B53' }),
      selected: true,
      selectedColor: '#1D2B53',
    };
    return marks;
  }, [scheduleBlocks, selectedDate, tasks]);

  const dayTasks = tasks.filter((task) => task.dueDate === selectedDate);
  const weekDates = useMemo(() => {
    const monday = new Date(`${selectedDate}T12:00:00`);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return toDateKey(date);
    });
  }, [selectedDate]);
  const selectedDayBlocks = scheduleBlocks
    .filter((block) => block.date === selectedDate)
    .sort((left, right) => left.hour - right.hour);
  const selectedDayHours = selectedDayBlocks.reduce(
    (total, block) => total + (block.durationHours ?? 1),
    0,
  );
  const weekLabel = `${new Date(`${weekDates[0]}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(`${weekDates[6]}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const todayDate = toDateKey(new Date());
  const matchingEvents = tasks.filter((task) => (
    task.dueDate && task.detail.toLowerCase().includes(searchQuery.trim().toLowerCase())
  ));

  const openMonthPicker = () => {
    const visibleDate = new Date(`${calendarMonth}T12:00:00`);
    const year = visibleDate.getFullYear();
    setPickerYear(year);
    setYearRangeStart(Math.floor(year / 10) * 10);
    setMonthPickerVisible(true);
  };

  const selectCalendarEvent = (task: TaskType) => {
    if (!task.dueDate) return;
    setCalendarMonth(task.dueDate);
    setSelectedDate(task.dueDate);
    setSearchVisible(false);
    setSearchQuery('');
  };

  const selectScheduleDate = (date: string) => {
    setSelectedDate(date);
    setCalendarMonth(date);
  };

  const selectMonth = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, '0');
    const date = `${pickerYear}-${month}-01`;
    setCalendarMonth(date);
    setSelectedDate(date);
    setMonthPickerVisible(false);
  };

  const toggleTask = async (task: TaskType) => {
    const updatedTask = await updateTask(task.id, { markedAsFinished: !task.markedAsFinished });
    setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)));
  };

  const openBlockEditor = (
    date: string,
    hour: number,
    block?: ScheduleBlockType,
    durationHours = block?.durationHours ?? 1,
  ) => {
    setBlockDraftSlot({ date, hour });
    setEditingBlock(block ?? null);
    setBlockLabel(block?.label ?? '');
    setBlockColor(block?.color ?? SCHEDULE_COLORS[0]);
    setBlockDurationHours(durationHours);
    setBlockEditorError('');
    setBlockEditorVisible(true);
  };

  const closeBlockEditor = () => {
    if (isSavingBlock) return;
    setBlockEditorVisible(false);
    setEditingBlock(null);
    setBlockDraftSlot(null);
    setBlockEditorError('');
  };

  const handleSaveBlock = async () => {
    if (!blockLabel.trim() || !blockDraftSlot) {
      setBlockEditorError('Label kegiatan wajib diisi.');
      return;
    }

    setIsSavingBlock(true);
    setBlockEditorError('');
    try {
      await saveScheduleBlock({
        ...blockDraftSlot,
        durationHours: blockDurationHours,
        label: blockLabel.trim(),
        color: blockColor,
      });
      setScheduleBlocks(await loadCachedScheduleBlocks());
      setBlockEditorVisible(false);
      setEditingBlock(null);
      setBlockDraftSlot(null);
    } catch (error) {
      setBlockEditorError(error instanceof Error ? error.message : 'Jadwal gagal disimpan.');
    } finally {
      setIsSavingBlock(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!editingBlock) return;
    setIsSavingBlock(true);
    setBlockEditorError('');
    try {
      await removeScheduleBlock(editingBlock.clientId);
      setScheduleBlocks(await loadCachedScheduleBlocks());
      setBlockEditorVisible(false);
      setEditingBlock(null);
      setBlockDraftSlot(null);
    } catch (error) {
      setBlockEditorError(error instanceof Error ? error.message : 'Jadwal gagal dihapus.');
    } finally {
      setIsSavingBlock(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen((open) => !open)}
            accessibilityLabel="Menu kalender"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#1D2B53" />
          </TouchableOpacity>
        </View>
        {menuOpen && (
          <View style={styles.headerMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setSearchVisible(true);
              }}
            >
              <Ionicons name="search-outline" size={18} color="#1D2B53" />
              <Text style={styles.menuItemText}>Cari acara</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.viewOption, viewMode === 'calendar' && styles.viewOptionActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.viewOptionText, viewMode === 'calendar' && styles.viewOptionTextActive]}>Kalender</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewOption, viewMode === 'timeblock' && styles.viewOptionActive]}
            onPress={() => setViewMode('timeblock')}
          >
            <Ionicons name="time-outline" size={16} color={viewMode === 'timeblock' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.viewOptionText, viewMode === 'timeblock' && styles.viewOptionTextActive]}>Time blocking</Text>
          </TouchableOpacity>
        </View>
        {viewMode === 'calendar' ? (
          <>
        <Calendar
          current={calendarMonth}
          onDayPress={(day: DateData) => {
            setSelectedDate(day.dateString);
            setCalendarMonth(day.dateString);
          }}
          onMonthChange={(month: DateData) => setCalendarMonth(month.dateString)}
          renderHeader={() => (
            <TouchableOpacity style={styles.monthHeaderButton} onPress={openMonthPicker}>
              <Text style={styles.monthHeaderText}>
                {MONTH_NAMES[Number(calendarMonth.slice(5, 7)) - 1]} {calendarMonth.slice(0, 4)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#1D2B53" />
            </TouchableOpacity>
          )}
          markedDates={markedDates}
          enableSwipeMonths
          theme={{
            todayTextColor: '#1D2B53',
            arrowColor: '#1D2B53',
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
          }}
        />
        <Text style={styles.selectedDate}>{selectedDate}</Text>
        {dayTasks.length === 0 ? (
          <Text style={styles.emptyText}>Tidak ada tugas atau acara pada tanggal ini.</Text>
        ) : (
          dayTasks.map((task) => (
            <View key={task.clientId ?? task.id} style={styles.eventCard}>
              {task.isTodo && (
                <TouchableOpacity onPress={() => toggleTask(task)} style={styles.checkButton}>
                  <Ionicons
                    name={task.markedAsFinished ? 'checkbox' : 'square-outline'}
                    size={23}
                    color={task.markedAsFinished ? '#64748B' : '#94A3B8'}
                  />
                </TouchableOpacity>
              )}
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, task.markedAsFinished && styles.completed]}>{task.detail}</Text>
                <Text style={styles.eventType}>{task.isTodo ? 'Todo' : 'Pengingat acara'}</Text>
                {task.category ? <Text style={styles.category}>{task.category}</Text> : null}
              </View>
            </View>
          ))
        )}
          </>
        ) : (
          <ScrollView
            style={styles.timeblockView}
            scrollEnabled
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.weekNavigator}>
              <TouchableOpacity
                style={styles.weekNavButton}
                onPress={() => {
                  const date = new Date(`${selectedDate}T12:00:00`);
                  date.setDate(date.getDate() - 7);
                  selectScheduleDate(toDateKey(date));
                }}
                accessibilityLabel="Minggu sebelumnya"
              >
                <Ionicons name="chevron-back" size={18} color="#1D2B53" />
              </TouchableOpacity>
              <Text style={styles.weekLabel}>{weekLabel}</Text>
              <TouchableOpacity
                style={styles.weekNavButton}
                onPress={() => {
                  const date = new Date(`${selectedDate}T12:00:00`);
                  date.setDate(date.getDate() + 7);
                  selectScheduleDate(toDateKey(date));
                }}
                accessibilityLabel="Minggu berikutnya"
              >
                <Ionicons name="chevron-forward" size={18} color="#1D2B53" />
              </TouchableOpacity>
            </View>
            {/* <View style={styles.daySummary}>
              <View style={styles.summaryIcon}>
                <Ionicons name="calendar" size={19} color="#1D2B53" />
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
                <Text style={styles.summaryDescription}>
                  {selectedDayHours} jam terjadwal · {24 - selectedDayHours} jam tersedia
                </Text>
              </View>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => selectScheduleDate(todayDate)}
              >
                <Text style={styles.todayButtonText}>Hari ini</Text>
              </TouchableOpacity>
            </View> */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ maxHeight: 400, overflowY: "scroll" }}>
                <View style={styles.weekHeaderRow}>
                  <View style={{ width: HOUR_LABEL_WIDTH }} />
                  {weekDates.map((date) => {
                    const parsed = new Date(`${date}T12:00:00`);
                    const isSelected = date === selectedDate;
                    return (
                      <TouchableOpacity
                        key={date}
                        style={[styles.weekDayHeader, isSelected && styles.weekDayHeaderSelected]}
                        onPress={() => selectScheduleDate(date)}
                      >
                        <Text style={[styles.weekDayName, isSelected && styles.weekDaySelectedText]}>
                          {WEEKDAY_NAMES[parsed.getDay()]}
                        </Text>
                        <Text style={[styles.weekDayNumber, isSelected && styles.weekDaySelectedText]}>
                          {parsed.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.hourGrid}>
                  <View style={styles.weekGrid}>
                    <View style={styles.hourLabelsColumn}>
                      {Array.from({ length: 24 }, (_, hour) => (
                        <View key={hour} style={styles.hourLabel}>
                          <Text style={styles.hourLabelText}>{String(hour).padStart(2, '0')}:00</Text>
                        </View>
                      ))}
                    </View>
                    {weekDates.map((date) => {
                      const dayBlocks = scheduleBlocks.filter((block) => block.date === date);
                      const activeDragSelection = dragSelection?.date === date ? dragSelection : null;
                      return (
                        <View key={date} style={styles.dayColumn}>
                          {Array.from({ length: 24 }, (_, hour) => (
                            <TouchableOpacity
                              key={hour}
                              style={[styles.hourCell, date === selectedDate && styles.hourCellSelectedDay]}
                              onPress={() => openBlockEditor(date, hour)}
                              accessibilityLabel={`${date}, pukul ${String(hour).padStart(2, '0')}:00, kosong`}
                            >
                              <View pointerEvents="none" style={styles.halfHourDivider} />
                            </TouchableOpacity>
                          ))}
                          {dayBlocks.map((block) => {
                            const durationHours = block.durationHours ?? 1;
                            return (
                              <TouchableOpacity
                                key={block.clientId}
                                style={[
                                  styles.positionedScheduleBlock,
                                  {
                                    top: block.hour * HOUR_ROW_HEIGHT + 2,
                                    height: durationHours * HOUR_ROW_HEIGHT - 4,
                                    backgroundColor: block.color,
                                  },
                                ]}
                                onPress={() => openBlockEditor(date, block.hour, block)}
                                accessibilityLabel={`${block.label}, ${formatTime(block.hour)} sampai ${formatTime(block.hour + durationHours)}`}
                              >
                                <Text style={styles.scheduleBlockLabel} numberOfLines={3}>{block.label}</Text>
                                <Text style={styles.scheduleBlockTime}>
                                  {formatTime(block.hour)}–{formatTime(block.hour + durationHours)}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          <View
                            style={styles.dayInteractionOverlay}
                            onStartShouldSetResponder={() => true}
                            onMoveShouldSetResponder={() => true}
                            onResponderTerminationRequest={() => true}
                            onResponderGrant={(event) => {
                              const hour = getHourFromOffset(event.nativeEvent.locationY);
                              dragStartHourRef.current = hour;
                              setDragSelection({ date, startHour: hour, endHour: hour });
                            }}
                            onResponderMove={(event) => {
                              if (dragStartHourRef.current === null) return;
                              setDragSelection({
                                date,
                                startHour: dragStartHourRef.current,
                                endHour: getHourFromOffset(event.nativeEvent.locationY),
                              });
                            }}
                            onResponderRelease={(event) => {
                              if (dragStartHourRef.current === null) return;
                              const startHour = dragStartHourRef.current;
                              const endHour = getHourFromOffset(event.nativeEvent.locationY);
                              dragStartHourRef.current = null;
                              setDragSelection(null);

                              const firstHour = Math.min(startHour, endHour);
                              const durationHours = Math.abs(endHour - startHour) + 0.5;
                              const existingBlock = dayBlocks.find((block) => (
                                firstHour >= block.hour
                                && firstHour < block.hour + (block.durationHours ?? 1)
                              ));
                              if (durationHours === 0.5 && existingBlock) {
                                openBlockEditor(date, existingBlock.hour, existingBlock);
                              } else {
                                openBlockEditor(date, firstHour, undefined, durationHours);
                              }
                            }}
                            onResponderTerminate={() => {
                              dragStartHourRef.current = null;
                              setDragSelection(null);
                            }}
                          >
                            {activeDragSelection && (
                              <View
                                pointerEvents="none"
                                style={[
                                  styles.dragPreview,
                                  {
                                    top: Math.min(activeDragSelection.startHour, activeDragSelection.endHour) * HOUR_ROW_HEIGHT + 2,
                                    height: (Math.abs(activeDragSelection.endHour - activeDragSelection.startHour) + 0.5) * HOUR_ROW_HEIGHT - 4,
                                  },
                                ]}
                              />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </ScrollView>
            <View style={styles.summaryList}>
              <Text style={styles.summaryListTitle}>Ringkasan kegiatan</Text>
              {selectedDayBlocks.length === 0 ? (
                <Text style={styles.emptyText}>Belum ada time block untuk hari ini.</Text>
              ) : selectedDayBlocks.map((block) => (
                <TouchableOpacity
                  key={block.clientId}
                  style={styles.summaryItem}
                  onPress={() => openBlockEditor(block.date, block.hour, block)}
                >
                  <View style={[styles.summaryColor, { backgroundColor: block.color }]} />
                  <Text style={styles.summaryTime}>
                    {formatTime(block.hour)}–{formatTime(block.hour + (block.durationHours ?? 1))}
                  </Text>
                  <Text style={styles.summaryBlockLabel} numberOfLines={1}>{block.label}</Text>
                  <Text style={styles.summaryDuration}>{formatDuration(block.durationHours ?? 1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
      <TaskForm
        visible={formVisible}
        fromCalendar
        initialDate={selectedDate}
        categories={categories}
        onClose={() => setFormVisible(false)}
        onSaved={(task) => setTasks((current) => upsertTask(current, task))}
        onCategoryCreated={(category) => setCategories((current) => (
          current.includes(category) ? current : [...current, category]
        ))}
      />
      {selectedDate !== todayDate && (
        <TouchableOpacity
          style={styles.todayFab}
          onPress={() => {
            setCalendarMonth(todayDate);
            setSelectedDate(todayDate);
          }}
          accessibilityLabel="Kembali ke hari ini"
        >
          <Text style={styles.todayFabNumber}>{new Date().getDate()}</Text>
        </TouchableOpacity>
      )}
      {viewMode === 'calendar' && (
        <TouchableOpacity
          style={styles.addFab}
          onPress={() => setFormVisible(true)}
          accessibilityLabel="Tambah acara"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Modal visible={blockEditorVisible} transparent animationType="fade" onRequestClose={closeBlockEditor}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={closeBlockEditor} />
          <View style={styles.blockEditorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBlock ? 'Edit time block' : 'Tambah time block'}</Text>
              <TouchableOpacity onPress={closeBlockEditor} accessibilityLabel="Tutup editor jadwal">
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.blockEditorSlot}>
              {blockDraftSlot && new Date(`${blockDraftSlot.date}T12:00:00`).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {blockDraftSlot && ` · mulai ${formatTime(blockDraftSlot.hour)}`}
            </Text>
            <Text style={styles.blockFieldLabel}>Durasi</Text>
            <View style={styles.durationPicker}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setBlockDurationHours((duration) => Math.max(0.5, duration - 0.5))}
                accessibilityLabel="Kurangi durasi"
              >
                <Ionicons name="remove" size={20} color="#1D2B53" />
              </TouchableOpacity>
              <Text style={styles.durationValue}>{formatDuration(blockDurationHours)}</Text>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setBlockDurationHours((duration) => Math.min(24 - (blockDraftSlot?.hour ?? 0), duration + 0.5))}
                accessibilityLabel="Tambah durasi"
              >
                <Ionicons name="add" size={20} color="#1D2B53" />
              </TouchableOpacity>
            </View>
            <Text style={styles.blockFieldLabel}>Label kegiatan</Text>
            <TextInput
              style={styles.blockLabelInput}
              value={blockLabel}
              onChangeText={setBlockLabel}
              placeholder="Contoh: Belajar, bekerja, istirahat"
              placeholderTextColor="#94A3B8"
              maxLength={60}
              autoFocus
            />
            <Text style={styles.blockFieldLabel}>Warna</Text>
            <View style={styles.colorPalette}>
              {SCHEDULE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, blockColor === color && styles.colorOptionSelected]}
                  onPress={() => setBlockColor(color)}
                  accessibilityLabel={`Pilih warna ${color}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: blockColor === color }}
                >
                  {blockColor === color && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>
            {blockEditorError ? <Text style={styles.blockEditorError}>{blockEditorError}</Text> : null}
            <View style={styles.blockEditorActions}>
              {editingBlock && (
                <TouchableOpacity
                  style={styles.deleteBlockButton}
                  onPress={handleDeleteBlock}
                  disabled={isSavingBlock}
                >
                  <Text style={styles.deleteBlockText}>Hapus</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBlockButton} onPress={closeBlockEditor} disabled={isSavingBlock}>
                <Text style={styles.cancelBlockText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBlockButton} onPress={handleSaveBlock} disabled={isSavingBlock}>
                <Text style={styles.saveBlockText}>{isSavingBlock ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={searchVisible} transparent animationType="fade" onRequestClose={() => setSearchVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setSearchVisible(false)} />
          <View style={styles.searchModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cari acara</Text>
              <TouchableOpacity onPress={() => setSearchVisible(false)} accessibilityLabel="Tutup pencarian">
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputRow}>
              <Ionicons name="search-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari nama acara..."
                placeholderTextColor="#94A3B8"
                autoFocus
              />
            </View>
            <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
              {matchingEvents.map((task) => (
                <TouchableOpacity
                  key={task.clientId ?? task.id}
                  style={styles.searchResult}
                  onPress={() => selectCalendarEvent(task)}
                >
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>{task.detail}</Text>
                    <Text style={styles.searchResultDate}>{task.dueDate}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              {matchingEvents.length === 0 && (
                <Text style={styles.noSearchResults}>Tidak ada acara yang cocok.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={monthPickerVisible} transparent animationType="fade" onRequestClose={() => setMonthPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setMonthPickerVisible(false)} />
          <View style={styles.monthPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih bulan dan tahun</Text>
              <TouchableOpacity onPress={() => setMonthPickerVisible(false)} accessibilityLabel="Tutup pemilih tanggal">
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.yearRangeHeader}>
              <TouchableOpacity
                style={styles.yearRangeButton}
                onPress={() => setYearRangeStart((start) => start - 10)}
                accessibilityLabel="Rentang tahun sebelumnya"
              >
                <Ionicons name="chevron-back" size={18} color="#1D2B53" />
              </TouchableOpacity>
              <Text style={styles.yearRangeText}>{yearRangeStart}–{yearRangeStart + 9}</Text>
              <TouchableOpacity
                style={styles.yearRangeButton}
                onPress={() => setYearRangeStart((start) => start + 10)}
                accessibilityLabel="Rentang tahun berikutnya"
              >
                <Ionicons name="chevron-forward" size={18} color="#1D2B53" />
              </TouchableOpacity>
            </View>
            <View style={styles.yearGrid}>
              {Array.from({ length: 10 }, (_, index) => yearRangeStart + index).map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[styles.yearOption, pickerYear === year && styles.pickerOptionSelected]}
                  onPress={() => setPickerYear(year)}
                >
                  <Text style={[styles.pickerOptionText, pickerYear === year && styles.pickerOptionTextSelected]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((month, index) => (
                <TouchableOpacity key={month} style={styles.monthOption} onPress={() => selectMonth(index)}>
                  <Text style={styles.monthOptionText}>{month.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, width: '90%', alignSelf: 'center', paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#1D2B53' },
  viewSwitcher: { flexDirection: 'row', gap: 6, padding: 4, marginBottom: 12, borderRadius: 12, backgroundColor: '#F1F5F9' },
  viewOption: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9 },
  viewOptionActive: { backgroundColor: '#1D2B53' },
  viewOptionText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  viewOptionTextActive: { color: '#FFFFFF' },
  menuButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  headerMenu: { position: 'absolute', zIndex: 5, top: 58, right: 0, minWidth: 150, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FFFFFF', elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
  menuItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  menuItemText: { fontSize: 14, fontWeight: '600', color: '#1D2B53' },
  monthHeaderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  monthHeaderText: { fontSize: 16, fontWeight: '800', color: '#1D2B53' },
  selectedDate: { marginTop: 20, marginBottom: 10, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  emptyText: { color: '#64748B', marginTop: 12 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  checkButton: { marginRight: 12 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  completed: { textDecorationLine: 'line-through', color: '#64748B' },
  eventType: { marginTop: 4, fontSize: 12, color: '#64748B' },
  category: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#475569' },
  timeblockView: { flexGrow: 0, flexShrink: 1, minHeight: 0, maxHeight: 600 },
  weekNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  weekNavButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  weekLabel: { fontSize: 15, fontWeight: '800', color: '#1D2B53' },
  daySummary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 12, borderRadius: 14, backgroundColor: '#F1F5F9' },
  summaryIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FFFFFF' },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#1D2939' },
  summaryDescription: { marginTop: 3, fontSize: 12, color: '#667085' },
  todayButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#FFFFFF' },
  todayButtonText: { fontSize: 12, fontWeight: '700', color: '#1D2B53' },
  weekHeaderRow: { flexDirection: 'row', paddingRight: 2, borderBottomWidth: 1, borderColor: '#D8DEE8', backgroundColor: '#FFFFFF' },
  weekDayHeader: { width: DAY_COLUMN_WIDTH, height: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderColor: '#E2E8F0' },
  weekDayHeaderSelected: { backgroundColor: '#EAF0FB' },
  weekDayName: { fontSize: 11, fontWeight: '700', color: '#667085' },
  weekDayNumber: { marginTop: 2, fontSize: 14, fontWeight: '800', color: '#344054' },
  weekDaySelectedText: { color: '#1D2B53' },
  hourGrid: { height: 24 * HOUR_ROW_HEIGHT },
  weekGrid: { flexDirection: 'row' },
  hourLabelsColumn: { width: HOUR_LABEL_WIDTH },
  hourLabel: { width: HOUR_LABEL_WIDTH, height: HOUR_ROW_HEIGHT, paddingTop: 4 },
  hourLabelText: { fontSize: 10, fontWeight: '600', color: '#667085' },
  dayColumn: { width: DAY_COLUMN_WIDTH, height: 24 * HOUR_ROW_HEIGHT, position: 'relative' },
  hourCell: { width: DAY_COLUMN_WIDTH, height: HOUR_ROW_HEIGHT, position: 'relative', alignItems: 'center', justifyContent: 'center', padding: 3, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  hourCellSelectedDay: { backgroundColor: '#F8FAFF' },
  halfHourDivider: { position: 'absolute', top: HALF_HOUR_HEIGHT, left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#E2E8F0' },
  positionedScheduleBlock: { position: 'absolute', left: 3, right: 3, zIndex: 2, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 7, overflow: 'hidden' },
  dayInteractionOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 3 },
  dragPreview: { position: 'absolute', left: 3, right: 3, borderWidth: 2, borderColor: '#1D2B53', borderRadius: 7, backgroundColor: 'rgba(29, 43, 83, 0.14)' },
  scheduleBlockLabel: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  scheduleBlockTime: { marginTop: 3, fontSize: 9, fontWeight: '600', color: '#FFFFFF' },
  summaryList: { paddingTop: 14, paddingBottom: 64 },
  summaryListTitle: { marginBottom: 8, fontSize: 15, fontWeight: '800', color: '#1D2939' },
  summaryItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderColor: '#EEF1F5' },
  summaryColor: { width: 8, height: 24, borderRadius: 5 },
  summaryTime: { width: 92, fontSize: 11, fontWeight: '700', color: '#475467' },
  summaryBlockLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#344054' },
  summaryDuration: { fontSize: 11, color: '#667085' },
  addFab: { position: 'absolute', right: 24, bottom: 96, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D2B53', elevation: 8 },
  todayFab: { position: 'absolute', right: 30, bottom: 164, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#1D2B53', elevation: 6 },
  todayFabNumber: { fontSize: 16, fontWeight: '800', color: '#1D2B53' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalDismiss: { ...StyleSheet.absoluteFill },
  searchModal: { width: '100%', maxWidth: 420, maxHeight: '75%', padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  blockEditorModal: { width: '100%', maxWidth: 420, padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  monthPickerModal: { width: '100%', maxWidth: 420, padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1D2B53' },
  blockEditorSlot: { marginBottom: 16, fontSize: 13, fontWeight: '600', color: '#667085' },
  blockFieldLabel: { marginBottom: 7, fontSize: 13, fontWeight: '700', color: '#344054' },
  durationPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 5, marginBottom: 16, borderRadius: 10, backgroundColor: '#F2F4F7' },
  durationButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#FFFFFF' },
  durationValue: { fontSize: 14, fontWeight: '800', color: '#1D2B53' },
  blockLabelInput: { height: 46, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, color: '#101828' },
  colorPalette: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  colorOption: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  colorOptionSelected: { borderWidth: 3, borderColor: '#D0D5DD' },
  blockEditorError: { marginBottom: 12, color: '#B42318', fontSize: 12 },
  blockEditorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  deleteBlockButton: { marginRight: 'auto', paddingHorizontal: 12, paddingVertical: 10 },
  deleteBlockText: { fontSize: 13, fontWeight: '700', color: '#B42318' },
  cancelBlockButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9, backgroundColor: '#F2F4F7' },
  cancelBlockText: { fontSize: 13, fontWeight: '700', color: '#475467' },
  saveBlockButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, backgroundColor: '#1D2B53' },
  saveBlockText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  searchInputRow: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC' },
  searchInput: { flex: 1, padding: 0, color: '#0F172A' },
  searchResults: { marginTop: 10 },
  searchResult: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchResultContent: { flex: 1, gap: 3 },
  searchResultTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  searchResultDate: { fontSize: 12, color: '#64748B' },
  noSearchResults: { paddingVertical: 20, color: '#64748B', textAlign: 'center' },
  yearRangeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  yearRangeButton: { width: 36, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F1F5F9' },
  yearRangeText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  yearOption: { width: '18.5%', height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F8FAFC' },
  pickerOptionSelected: { backgroundColor: '#1D2B53' },
  pickerOptionText: { fontSize: 12, color: '#475569' },
  pickerOptionTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthOption: { width: '23%', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F1F5F9' },
  monthOptionText: { fontSize: 13, fontWeight: '600', color: '#1D2B53' },
});
