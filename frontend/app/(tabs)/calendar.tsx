import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { TaskForm } from '@/components/TaskForm';
import { fetchTaskCategories, fetchTasks, updateTask } from '@/lib/api';
import type { TaskType } from '@/lib/types';

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(toDateKey(new Date()));
  const [formVisible, setFormVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(new Date().getFullYear() / 10) * 10);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchTasks()
        .then((updatedTasks) => {
          if (isActive) setTasks(updatedTasks);
        })
        .catch(() => {
          if (isActive) setTasks([]);
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    fetchTaskCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        marks[task.dueDate] = { marked: true, dotColor: task.isTodo ? '#1D2B53' : '#10B981' };
      }
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? { marked: false, dotColor: '#1D2B53' }),
      selected: true,
      selectedColor: '#1D2B53',
    };
    return marks;
  }, [selectedDate, tasks]);

  const dayTasks = tasks.filter((task) => task.dueDate === selectedDate);
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
            <View key={task.id} style={styles.eventCard}>
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
      </View>
      <TaskForm
        visible={formVisible}
        fromCalendar
        initialDate={selectedDate}
        categories={categories}
        onClose={() => setFormVisible(false)}
        onSaved={(task) => setTasks((current) => [...current, task])}
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
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => setFormVisible(true)}
        accessibilityLabel="Tambah acara"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

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
                  key={task.id}
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
  addFab: { position: 'absolute', right: 24, bottom: 96, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D2B53', elevation: 8 },
  todayFab: { position: 'absolute', right: 30, bottom: 164, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#1D2B53', elevation: 6 },
  todayFabNumber: { fontSize: 16, fontWeight: '800', color: '#1D2B53' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalDismiss: { ...StyleSheet.absoluteFill },
  searchModal: { width: '100%', maxWidth: 420, maxHeight: '75%', padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  monthPickerModal: { width: '100%', maxWidth: 420, padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1D2B53' },
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
