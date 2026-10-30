import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchTaskCategories,
  fetchTasks,
  loadCachedCategories,
  loadCachedTasks,
  subscribeToLocalDataChanges,
  updateTask,
} from '@/lib/api';
import { upsertTask } from '@/lib/taskUtils';
import type { TaskType } from '@/lib/types';

export type TaskSortOrder = 'terbaru' | 'terlama' | 'a-z' | 'z-a';
type TaskSection = 'sebelumnya' | 'hari_ini' | 'masa_mendatang' | 'selesai';

export const SORT_OPTIONS: { value: TaskSortOrder; label: string }[] = [
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

export function useTodoTasks() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>('terbaru');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchTasks()
        .then((updatedTasks) => {
          if (isActive) setTasks(updatedTasks);
        })
        .catch((error) => console.error('Failed to read cached tasks:', error))
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

  const filteredTasks = useMemo(() => tasks.filter((task) => {
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
  }), [searchQuery, selectedCategory, sortOrder, tasks]);

  const categories = useMemo(() => [
    'Semua',
    ...new Set([
      ...savedCategories,
      ...tasks.map((task) => task.category).filter(Boolean),
    ].filter((category) => category !== 'Semua')),
  ], [savedCategories, tasks]);

  const toggleTask = useCallback(async (task: TaskType) => {
    const updatedTask = await updateTask(task.id, { markedAsFinished: !task.markedAsFinished });
    setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)));
  }, []);

  const saveTask = useCallback((task: TaskType) => {
    setTasks((current) => upsertTask(current, task));
  }, []);

  const addCategory = useCallback((category: string) => {
    setSavedCategories((current) => current.includes(category) ? current : [...current, category]);
  }, []);

  const tasksBySection = useMemo(() => ({
    sebelumnya: filteredTasks.filter((task) => getTaskSection(task) === 'sebelumnya'),
    hari_ini: filteredTasks.filter((task) => getTaskSection(task) === 'hari_ini'),
    masa_mendatang: filteredTasks.filter((task) => getTaskSection(task) === 'masa_mendatang'),
    selesai: filteredTasks.filter((task) => getTaskSection(task) === 'selesai'),
  }), [filteredTasks]);

  return {
    categories,
    filteredTasks,
    hasTodoTasks: tasks.some((task) => task.isTodo),
    isLoadingTasks,
    tasksBySection,
    toggleTask,
    saveTask,
    addCategory,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,
    sortMenuOpen,
    setSortMenuOpen,
  };
}
