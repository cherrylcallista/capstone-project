import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import { fetchTasks, loadCachedTasks, subscribeToLocalDataChanges } from '@/lib/api';
import type { TaskType } from '@/lib/types';

const QUADRANTS = [
  { id: 1, title: 'Penting dan Mendesak' },
  { id: 2, title: 'Penting, namun Tidak Mendesak' },
  { id: 3, title: 'Tidak Penting, namun Mendesak' },
  { id: 4, title: 'Tidak Penting dan Tidak Mendesak' },
];

export default function MatrixScreen() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'flex'>('grid');
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
        });
      const unsubscribe = subscribeToLocalDataChanges(() => {
        loadCachedTasks()
          .then((updatedTasks) => {
            if (isActive) setTasks(updatedTasks);
          })
          .catch((error) => console.error('Failed to refresh cached tasks:', error));
      });

      return () => {
        isActive = false;
        unsubscribe();
      };
    }, []),
  );

  const tasksFor = (quadrantId: number) => tasks.filter(
    (task) => task.isTodo && !task.markedAsFinished && task.matrix === quadrantId,
  );

  const renderTasks = (quadrantId: number, limit?: number) => {
    const quadrantTasks = tasksFor(quadrantId);
    const visibleTasks = limit === undefined ? quadrantTasks : quadrantTasks.slice(0, limit);
    return visibleTasks.map((task, index) => (
      <TouchableOpacity
        key={task.clientId ?? task.id}
        style={styles.taskItem}
        onPress={() => setSelectedTask(task)}
        accessibilityRole="button"
        accessibilityLabel={`Buka detail tugas: ${task.detail}`}
      >
        <Text style={styles.taskText}>{index + 1}. {task.detail}</Text>
      </TouchableOpacity>
    ));
  };

  const renderFlexQuadrant = (quadrantId: number) => (
    <View key={quadrantId} style={styles.flexSection}>
      <Text style={styles.quadrantTitle}>{QUADRANTS[quadrantId - 1].title}</Text>
      <View style={styles.flexCard}>{renderTasks(quadrantId)}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mode Tampilan</Text>
          <View style={styles.segmented}>
            {(['grid', 'flex'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.segment, viewMode === mode && styles.segmentActive]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.segmentText, viewMode === mode && styles.segmentTextActive]}>
                  {mode === 'grid' ? 'Grid' : 'Flex'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {viewMode === 'grid' ? (
          <View>
            <View style={styles.columnHeadings}>
              <View style={styles.axisSpacer} />
              <Text style={styles.axisHeading}>Mendesak</Text>
              <Text style={styles.axisHeading}>Tidak Mendesak</Text>
            </View>
            <View style={styles.matrixLayout}>
              <View style={styles.rowHeadings}>
                <View style={styles.rowHeadingSlot}>
                  <Text style={styles.rowHeadingText}>Penting</Text>
                </View>
                <View style={styles.rowHeadingSlot}>
                  <Text style={styles.rowHeadingText}>Tidak Penting</Text>
                </View>
              </View>
              <View style={styles.grid}>
                <View style={[styles.quadrant, styles.topLeft]}>{renderTasks(1, 9)}</View>
                <View style={[styles.quadrant, styles.topRight]}>{renderTasks(2, 9)}</View>
                <View style={[styles.quadrant, styles.bottomLeft]}>{renderTasks(3, 9)}</View>
                <View style={[styles.quadrant, styles.bottomRight]}>{renderTasks(4, 9)}</View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewAll}
              onPress={() => setViewMode('flex')}
              accessibilityRole="button"
            >
              <Text style={styles.viewAllText}>Lihat semua</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.flexList}>
            {QUADRANTS.map((quadrant) => renderFlexQuadrant(quadrant.id))}
          </View>
        )}
      </ScrollView>
      <TaskDetailsModal
        task={selectedTask}
        categories={[...new Set(tasks.map((task) => task.category).filter(Boolean))]}
        onClose={() => setSelectedTask(null)}
        onSaved={(updatedTask) => {
          setTasks((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
          setSelectedTask(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', width: '90%', alignSelf: 'center' },
  content: { paddingTop: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  segmented: { width: 168, flexDirection: 'row', padding: 3, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, backgroundColor: '#F3F4F6' },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 6 },
  segmentActive: { backgroundColor: '#1D2B53' },
  segmentText: { fontSize: 13, fontWeight: '500', color: '#4B5563' },
  segmentTextActive: { color: '#FFFFFF' },
  columnHeadings: { flexDirection: 'row', marginBottom: 8 },
  axisSpacer: { width: 32 },
  axisHeading: { flex: 1, textAlign: 'center', fontSize: 12, color: '#737373' },
  matrixLayout: { flexDirection: 'row' },
  rowHeadings: { width: 32 },
  rowHeadingSlot: { height: 205, alignItems: 'center', justifyContent: 'center' },
  rowHeadingText: { width: 90, textAlign: 'center', fontSize: 12, color: '#737373', transform: [{ rotate: '-90deg' }] },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F3F3' },
  quadrant: { width: '50%', minHeight: 205, padding: 12 },
  topLeft: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#C9C9C9' },
  topRight: { borderBottomWidth: 1, borderColor: '#C9C9C9' },
  bottomLeft: { borderRightWidth: 1, borderColor: '#C9C9C9' },
  bottomRight: {},
  quadrantTitle: { marginBottom: 8, fontSize: 13, fontWeight: '500', color: '#737373' },
  taskItem: { alignSelf: 'stretch', borderRadius: 6 },
  taskText: { marginBottom: 4, fontSize: 12, lineHeight: 16, color: '#525252' },
  viewAll: { alignSelf: 'flex-start', paddingTop: 8, paddingBottom: 4 },
  viewAllText: { fontSize: 12, fontWeight: '600', color: '#1D2B53', textDecorationLine: 'underline' },
  flexList: { gap: 12 },
  flexSection: { gap: 0 },
  flexCard: { minHeight: 192, padding: 12, borderRadius: 12, backgroundColor: '#F3F3F3' },
});
