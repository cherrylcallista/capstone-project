import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarSearchModal } from '@/components/calendar/CalendarSearchModal';
import { MonthYearPickerModal } from '@/components/calendar/MonthYearPickerModal';
import { TimeBlockEditorModal } from '@/components/calendar/TimeBlockEditorModal';
import { TimeBlockWeekView } from '@/components/calendar/TimeBlockWeekView';
import { AppText as Text } from '@/components/AppTypography';
import {
  updateTask,
} from '@/lib/api';
import type { TaskType } from '@/lib/types';
import { upsertTask } from '@/lib/taskUtils';
import { useCalendarData } from '@/features/calendar/useCalendarData';
import { useCalendarNavigation } from '@/features/calendar/useCalendarNavigation';
import { useTimeBlockEditor } from '@/features/calendar/useTimeBlockEditor';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const {
    tasks,
    setTasks,
    scheduleBlocks,
    setScheduleBlocks,
    categories,
    setCategories,
  } = useCalendarData();
  const blockEditor = useTimeBlockEditor(setScheduleBlocks);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useCalendarNavigation(tasks, scheduleBlocks, searchQuery);
  const {
    selectedDate,
    setCalendarMonth,
    calendarMonth,
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
    selectCalendarEvent: chooseCalendarEvent,
    selectMonth,
    monthNames,
  } = navigation;
  const [viewMode, setViewMode] = useState<'calendar' | 'timeblock'>('calendar');
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const selectCalendarEvent = (task: TaskType) => {
    chooseCalendarEvent(task, () => {
      setSearchVisible(false);
      setSearchQuery('');
    });
  };

  const toggleTask = async (task: TaskType) => {
    const updatedTask = await updateTask(task.id, { markedAsFinished: !task.markedAsFinished });
    setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)));
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
            <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
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
              <Ionicons name="search-outline" size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Cari acara</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.viewOption, viewMode === 'calendar' && styles.viewOptionActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? colors.onPrimary : colors.textSecondary} />
            <Text style={[styles.viewOptionText, viewMode === 'calendar' && styles.viewOptionTextActive]}>Kalender</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewOption, viewMode === 'timeblock' && styles.viewOptionActive]}
            onPress={() => setViewMode('timeblock')}
          >
            <Ionicons name="time-outline" size={16} color={viewMode === 'timeblock' ? colors.onPrimary : colors.textSecondary} />
            <Text style={[styles.viewOptionText, viewMode === 'timeblock' && styles.viewOptionTextActive]}>Time blocking</Text>
          </TouchableOpacity>
        </View>
        {viewMode === 'calendar' ? (
          <CalendarMonthView
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            markedDates={markedDates}
            dayTasks={dayTasks}
            monthNames={monthNames}
            onOpenMonthPicker={openMonthPicker}
            onSelectDate={(date) => {
              goToDate(date);
            }}
            onChangeMonth={setCalendarMonth}
            onToggleTask={toggleTask}
            onSelectTask={setSelectedTask}
          />
        ) : (
          <TimeBlockWeekView
            selectedDate={selectedDate}
            weekDates={weekDates}
            weekLabel={weekLabel}
            scheduleBlocks={scheduleBlocks}
            onSelectDate={goToDate}
            onOpenBlockEditor={blockEditor.open}
          />
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
      <TaskDetailsModal
        task={selectedTask}
        categories={categories}
        onClose={() => setSelectedTask(null)}
        onSaved={(updatedTask) => {
          setTasks((current) => upsertTask(current, updatedTask));
          setSelectedTask(null);
        }}
      />
      {selectedDate !== todayDate && (
        <TouchableOpacity
          style={styles.todayFab}
          onPress={() => {
            goToDate(todayDate);
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
          <Ionicons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      )}

      <TimeBlockEditorModal
        visible={blockEditor.visible}
        editingBlock={blockEditor.editingBlock}
        slot={blockEditor.slot}
        label={blockEditor.label}
        color={blockEditor.color}
        durationHours={blockEditor.durationHours}
        colors={blockEditor.colors}
        error={blockEditor.error}
        isSaving={blockEditor.isSaving}
        onLabelChange={blockEditor.setLabel}
        onColorChange={blockEditor.setColor}
        onDurationChange={blockEditor.setDurationHours}
        onClose={blockEditor.close}
        onDelete={blockEditor.remove}
        onSave={blockEditor.save}
      />

      <CalendarSearchModal
        visible={searchVisible}
        query={searchQuery}
        tasks={matchingEvents}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchVisible(false)}
        onSelectTask={selectCalendarEvent}
      />
      <MonthYearPickerModal
        visible={monthPickerVisible}
        months={monthNames}
        selectedYear={pickerYear}
        yearRangeStart={yearRangeStart}
        onYearChange={setPickerYear}
        onYearRangeChange={setYearRangeStart}
        onSelectMonth={selectMonth}
        onClose={() => setMonthPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: '90%', alignSelf: 'center', paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: colors.primary },
  viewSwitcher: { flexDirection: 'row', gap: 6, padding: 4, marginBottom: 12, borderRadius: 12, backgroundColor: colors.surfaceSecondary },
  viewOption: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9 },
  viewOptionActive: { backgroundColor: colors.primary },
  viewOptionText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  viewOptionTextActive: { color: colors.onPrimary },
  menuButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  headerMenu: { position: 'absolute', zIndex: 5, top: 58, right: 0, minWidth: 150, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.surface, elevation: 8, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
  menuItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  menuItemText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  addFab: { position: 'absolute', right: 22, bottom: 94, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, elevation: 8 },
  todayFab: { position: 'absolute', right: 30, bottom: 164, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary, elevation: 6 },
  todayFabNumber: { fontSize: 16, fontWeight: '800', color: colors.primary },
});
