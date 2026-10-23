import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import {
  fetchTaskCategories,
  fetchTasks,
  loadCachedCategories,
  loadCachedTasks,
  subscribeToLocalDataChanges,
  updateTask,
} from '@/lib/api';
import type { TaskType } from '@/lib/types';

type TaskSection = 'sebelumnya' | 'hari_ini' | 'masa_mendatang' | 'selesai';
type TaskSortOrder = 'terbaru' | 'terlama' | 'a-z' | 'z-a';

const SORT_OPTIONS: { value: TaskSortOrder; label: string }[] = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
  { value: 'a-z', label: 'A–Z' },
  { value: 'z-a', label: 'Z–A' },
];

function getTaskSection(task: TaskType): TaskSection {
  if (task.markedAsFinished) return 'selesai';
  if (!task.dueDate) return 'masa_mendatang';
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today ? 'sebelumnya' : task.dueDate === today ? 'hari_ini' : 'masa_mendatang';
}

function upsertTask(tasks: TaskType[], updatedTask: TaskType) {
  const existingIndex = tasks.findIndex((task) => (
    (updatedTask.clientId && task.clientId === updatedTask.clientId)
    || task.id === updatedTask.id
  ));
  if (existingIndex < 0) return [...tasks, updatedTask];
  return tasks.map((task, index) => index === existingIndex ? updatedTask : task);
}

export default function TodoScreen() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>('terbaru');
  const [formVisible, setFormVisible] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchTasks()
        .then((updatedTasks) => {
          if (isActive) setTasks(updatedTasks);
        })
        .catch((error) => {
          console.error('Failed to read cached tasks:', error);
        })
        .finally(() => {
          if (isActive) setIsLoadingTasks(false);
        });
      const unsubscribe = subscribeToLocalDataChanges(() => {
        loadCachedTasks()
          .then((updatedTasks) => {
            if (isActive) setTasks(updatedTasks);
          })
          .catch((error) => console.error('Failed to refresh cached tasks:', error));
        loadCachedCategories()
          .then((updatedCategories) => {
            if (isActive) setSavedCategories(updatedCategories);
          })
          .catch((error) => console.error('Failed to refresh cached categories:', error));
      });

      return () => {
        isActive = false;
        unsubscribe();
      };
    }, []),
  );

  useEffect(() => {
    fetchTaskCategories()
      .then(setSavedCategories)
      .catch((error) => console.error('Failed to read cached categories:', error));
  }, []);

  const toggleTask = async (task: TaskType) => {
    const updatedTask = await updateTask(task.id, { markedAsFinished: !task.markedAsFinished });
    setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)));
  };

  const handleDetailsSaved = (updatedTask: TaskType) => {
    setTasks((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.detail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || task.category === selectedCategory;
    return task.isTodo && matchesSearch && matchesCategory;
  }).sort((left, right) => {
    if (sortOrder === 'a-z' || sortOrder === 'z-a') {
      const comparison = left.detail.localeCompare(right.detail, 'id', { sensitivity: 'base' });
      return sortOrder === 'a-z' ? comparison : -comparison;
    }

    const leftAddedTime = Date.parse(left.addedTime);
    const rightAddedTime = Date.parse(right.addedTime);
    const leftTime = Number.isNaN(leftAddedTime) ? 0 : leftAddedTime;
    const rightTime = Number.isNaN(rightAddedTime) ? 0 : rightAddedTime;
    return sortOrder === 'terbaru' ? rightTime - leftTime : leftTime - rightTime;
  });
  const categories = [
    'Semua',
    ...new Set([
      ...savedCategories,
      ...tasks.map((task) => task.category).filter(Boolean),
    ].filter((category) => category !== 'Semua')),
  ];
  const hasTodoTasks = tasks.some((task) => task.isTodo);

  const renderSection = (section: TaskSection, title: string) => {
    const sectionTasks = filteredTasks.filter((task) => getTaskSection(task) === section);
    if (sectionTasks.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sectionTasks.map((task) => (
          <View key={task.clientId ?? task.id} style={[styles.taskCard, task.markedAsFinished && styles.completedCard]}>
            <TouchableOpacity style={styles.checkbox} onPress={() => toggleTask(task)}>
              <Ionicons
                name={task.markedAsFinished ? 'checkbox' : 'square-outline'}
                size={24}
                color={task.markedAsFinished ? '#64748B' : '#94A3B8'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.taskContent}
              onPress={() => setSelectedTask(task)}
              accessibilityRole="button"
              accessibilityLabel={`Buka detail tugas: ${task.detail}`}
            >
              <Text style={[styles.taskTitle, task.markedAsFinished && styles.completedText]}>
                {task.detail}
              </Text>
              <Text style={[styles.taskDate, task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && styles.overdueDate]}>
                {task.dueDate ?? 'Tanpa tanggal'}
              </Text>
              {task.category ? <Text style={styles.categoryText}>{task.category}</Text> : null}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>To-do List</Text>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pencarian..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search-outline" size={18} color="#64748B" />
          </View>
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Urutkan:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptions}
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortOption, sortOrder === option.value && styles.sortOptionSelected]}
                onPress={() => setSortOrder(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: sortOrder === option.value }}
              >
                <Text style={[styles.sortOptionLabel, sortOrder === option.value && styles.sortOptionLabelSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          style={styles.categoryScroller}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.category, selectedCategory === category && styles.selectedCategory]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                numberOfLines={1}
                style={[styles.categoryLabel, selectedCategory === category && styles.selectedCategoryLabel]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {renderSection('sebelumnya', 'Sebelumnya')}
        {renderSection('hari_ini', 'Hari ini')}
        {renderSection('masa_mendatang', 'Masa Mendatang')}
        {renderSection('selesai', 'Selesai')}
        {!isLoadingTasks && filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="file-tray-outline"
              size={82}
              color="#B5B5B5"
            />
            <Text style={styles.emptyTitle}>
              {hasTodoTasks ? 'Tidak ditemukan tugas yang sesuai.' : 'Belum ada tugas.'}
            </Text>
            <Text style={styles.emptyDescription}>
              {hasTodoTasks
                ? 'Coba ubah kategori atau kata pencarian.'
                : 'Tambahkan tugas sekarang untuk mulai mengatur harimu.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <TaskForm
        visible={formVisible}
        categories={categories.filter((category) => category !== 'Semua')}
        onClose={() => setFormVisible(false)}
        onSaved={(task) => setTasks((current) => upsertTask(current, task))}
        onCategoryCreated={(category) => setSavedCategories((current) => (
          current.includes(category) ? current : [...current, category]
        ))}
      />
      <TaskDetailsModal
        task={selectedTask}
        categories={categories}
        onClose={() => setSelectedTask(null)}
        onSaved={handleDetailsSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', width: '90%', alignSelf: 'center' },
  content: { flexGrow: 1, paddingTop: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#1D2B53' },
  searchBox: { flexDirection: 'row', alignItems: 'center', width: 150, height: 38, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 24 },
  searchInput: { flex: 1, padding: 0, fontSize: 13, color: '#0F172A' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sortLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  sortOptions: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  sortOption: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, backgroundColor: '#FFFFFF' },
  sortOptionSelected: { borderColor: '#1D2B53', backgroundColor: '#1D2B53' },
  sortOptionLabel: { fontSize: 12, fontWeight: '700', color: '#1D2B53' },
  sortOptionLabelSelected: { color: '#FFFFFF' },
  categoryScroller: { height: 44, flexGrow: 0, marginBottom: 24 },
  categories: { gap: 10, paddingVertical: 2, alignItems: 'center' },
  category: { height: 38, minWidth: 74, maxWidth: 180, flexShrink: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  selectedCategory: { backgroundColor: '#1D2B53', borderColor: '#1D2B53' },
  categoryLabel: { maxWidth: 145, fontSize: 13, fontWeight: '700', color: '#1D2B53' },
  selectedCategoryLabel: { color: '#FFFFFF' },
  emptyState: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', color: '#64748B', textAlign: 'center' },
  emptyDescription: { marginTop: 6, maxWidth: 240, fontSize: 14, lineHeight: 20, color: '#64748B', textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { marginBottom: 10, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, marginBottom: 10, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  completedCard: { backgroundColor: '#F1F5F9', opacity: 0.8 },
  checkbox: { marginRight: 12, marginTop: 1 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  completedText: { textDecorationLine: 'line-through', color: '#64748B' },
  taskDate: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#475569' },
  overdueDate: { color: '#DC2626' },
  categoryText: { marginTop: 6, fontSize: 11, fontWeight: '600', color: '#475569' },
  fab: { position: 'absolute', right: 24, bottom: 96, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D2B53', elevation: 8 },
  detailBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  detailDismiss: { flex: 1 },
  detailSheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#FFFFFF' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: '#1D2B53' },
  detailContent: { gap: 14, padding: 20, paddingTop: 8, paddingBottom: 28 },
  detailField: { gap: 6 },
  detailLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  detailInput: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC', color: '#0F172A' },
  detailMultiline: { minHeight: 74, paddingTop: 12, textAlignVertical: 'top' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearDateButton: { width: 36, height: 46, alignItems: 'center', justifyContent: 'center' },
  detailSelect: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC' },
  detailSelectText: { flex: 1, color: '#0F172A', fontSize: 14 },
  detailPlaceholder: { flex: 1, color: '#64748B', fontSize: 14 },
  detailOptions: { overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF' },
  detailOption: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  detailOptionActive: { backgroundColor: '#1D2B53' },
  detailOptionText: { color: '#334155', fontSize: 13 },
  detailOptionTextActive: { color: '#FFFFFF', fontWeight: '700' },
  finishedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addedDateText: { fontSize: 12, color: '#64748B' },
  detailError: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailCancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#E2E8F0' },
  detailCancelText: { color: '#334155', fontWeight: '700' },
  detailSaveButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#1D2B53' },
  detailSaveText: { color: '#FFFFFF', fontWeight: '700' },
  detailDateBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  detailDateModal: { width: '100%', maxWidth: 380, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF' },
  datePickerClose: { alignSelf: 'flex-end', padding: 10 },
});
