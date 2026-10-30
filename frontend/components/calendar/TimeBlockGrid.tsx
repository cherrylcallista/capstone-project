import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/AppTypography';
import type { ScheduleBlockType } from '@/lib/types';
import { formatTime, getHourFromOffset } from '@/lib/calendarUtils';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const HOUR_LABEL_WIDTH = 52;
const DAY_COLUMN_WIDTH = 96;
const HOUR_ROW_HEIGHT = 52;
const HALF_HOUR_HEIGHT = HOUR_ROW_HEIGHT / 2;

type TimeBlockGridProps = {
  selectedDate: string;
  weekDates: string[];
  scheduleBlocks: ScheduleBlockType[];
  onSelectDate: (date: string) => void;
  onOpenBlockEditor: (
    date: string,
    hour: number,
    block?: ScheduleBlockType,
    durationHours?: number,
  ) => void;
};

export function TimeBlockGrid({
  selectedDate,
  weekDates,
  scheduleBlocks,
  onSelectDate,
  onOpenBlockEditor,
}: TimeBlockGridProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const [dragSelection, setDragSelection] = useState<{
    date: string;
    startHour: number;
    endHour: number;
  } | null>(null);
  const dragStartHourRef = useRef<number | null>(null);

  const openDraggedRange = (
    date: string,
    startHour: number,
    endHour: number,
    dayBlocks: ScheduleBlockType[],
  ) => {
    const firstHour = Math.min(startHour, endHour);
    const durationHours = Math.abs(endHour - startHour) + 0.5;
    const existingBlock = dayBlocks.find((block) => (
      firstHour >= block.hour
      && firstHour < block.hour + (block.durationHours ?? 1)
    ));
    if (durationHours === 0.5 && existingBlock) {
      onOpenBlockEditor(date, existingBlock.hour, existingBlock);
    } else {
      onOpenBlockEditor(date, firstHour, undefined, durationHours);
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ maxHeight: 400, overflowY: 'scroll' }}>
        <View style={styles.weekHeaderRow}>
          <View style={{ width: HOUR_LABEL_WIDTH }} />
          {weekDates.map((date) => {
            const parsed = new Date(`${date}T12:00:00`);
            const isSelected = date === selectedDate;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.weekDayHeader, isSelected && styles.weekDayHeaderSelected]}
                onPress={() => onSelectDate(date)}
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
                      onPress={() => onOpenBlockEditor(date, hour)}
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
                        onPress={() => onOpenBlockEditor(date, block.hour, block)}
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
                      const hour = getHourFromOffset(event.nativeEvent.locationY, HALF_HOUR_HEIGHT);
                      dragStartHourRef.current = hour;
                      setDragSelection({ date, startHour: hour, endHour: hour });
                    }}
                    onResponderMove={(event) => {
                      if (dragStartHourRef.current === null) return;
                      setDragSelection({
                        date,
                        startHour: dragStartHourRef.current,
                        endHour: getHourFromOffset(event.nativeEvent.locationY, HALF_HOUR_HEIGHT),
                      });
                    }}
                    onResponderRelease={(event) => {
                      if (dragStartHourRef.current === null) return;
                      const startHour = dragStartHourRef.current;
                      const endHour = getHourFromOffset(event.nativeEvent.locationY, HALF_HOUR_HEIGHT);
                      dragStartHourRef.current = null;
                      setDragSelection(null);
                      openDraggedRange(date, startHour, endHour, dayBlocks);
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
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  weekHeaderRow: { flexDirection: 'row', paddingRight: 2, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  weekDayHeader: { width: DAY_COLUMN_WIDTH, height: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderColor: colors.border },
  weekDayHeaderSelected: { backgroundColor: colors.primarySurface },
  weekDayName: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  weekDayNumber: { marginTop: 2, fontSize: 14, fontWeight: '800', color: colors.textSecondary },
  weekDaySelectedText: { color: colors.primaryText },
  hourGrid: { height: 24 * HOUR_ROW_HEIGHT },
  weekGrid: { flexDirection: 'row' },
  hourLabelsColumn: { width: HOUR_LABEL_WIDTH },
  hourLabel: { width: HOUR_LABEL_WIDTH, height: HOUR_ROW_HEIGHT, paddingTop: 4 },
  hourLabelText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  dayColumn: { width: DAY_COLUMN_WIDTH, height: 24 * HOUR_ROW_HEIGHT, position: 'relative' },
  hourCell: { width: DAY_COLUMN_WIDTH, height: HOUR_ROW_HEIGHT, position: 'relative', alignItems: 'center', justifyContent: 'center', padding: 3, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  hourCellSelectedDay: { backgroundColor: colors.inputBackground },
  halfHourDivider: { position: 'absolute', top: HALF_HOUR_HEIGHT, left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  positionedScheduleBlock: { position: 'absolute', left: 3, right: 3, zIndex: 2, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 7, overflow: 'hidden' },
  dayInteractionOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 3 },
  dragPreview: { position: 'absolute', left: 3, right: 3, borderWidth: 2, borderColor: colors.primary, borderRadius: 7, backgroundColor: colors.primarySurface },
  scheduleBlockLabel: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  scheduleBlockTime: { marginTop: 3, fontSize: 9, fontWeight: '600', color: '#FFFFFF' },
});
