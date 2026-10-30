import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchScheduleBlocks,
  fetchTaskCategories,
  fetchTasks,
  loadCachedCategories,
  loadCachedScheduleBlocks,
  loadCachedTasks,
  subscribeToLocalDataChanges,
} from '@/lib/api';
import type { ScheduleBlockType, TaskType } from '@/lib/types';

export function useCalendarData() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlockType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

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

  return {
    tasks,
    setTasks,
    scheduleBlocks,
    setScheduleBlocks,
    categories,
    setCategories,
  };
}
