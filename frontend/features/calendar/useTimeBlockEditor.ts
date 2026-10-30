import { useState } from 'react';
import {
  loadCachedScheduleBlocks,
  removeScheduleBlock,
  saveScheduleBlock,
} from '@/lib/api';
import type { ScheduleBlockType } from '@/lib/types';

const SCHEDULE_COLORS = ['#587B8A', '#D88978', '#8E78A8', '#57927D', '#C99A48', '#4E77B8'];

export function useTimeBlockEditor(
  setScheduleBlocks: (blocks: ScheduleBlockType[]) => void,
) {
  const [visible, setVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlockType | null>(null);
  const [slot, setSlot] = useState<{ date: string; hour: number } | null>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(SCHEDULE_COLORS[0]);
  const [durationHours, setDurationHours] = useState(1);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const open = (
    date: string,
    hour: number,
    block?: ScheduleBlockType,
    duration = block?.durationHours ?? 1,
  ) => {
    setSlot({ date, hour });
    setEditingBlock(block ?? null);
    setLabel(block?.label ?? '');
    setColor(block?.color ?? SCHEDULE_COLORS[0]);
    setDurationHours(duration);
    setError('');
    setVisible(true);
  };

  const close = () => {
    if (isSaving) return;
    setVisible(false);
    setEditingBlock(null);
    setSlot(null);
    setError('');
  };

  const save = async () => {
    if (!label.trim() || !slot) {
      setError('Label kegiatan wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await saveScheduleBlock({
        ...slot,
        durationHours,
        label: label.trim(),
        color,
      });
      setScheduleBlocks(await loadCachedScheduleBlocks());
      setVisible(false);
      setEditingBlock(null);
      setSlot(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Jadwal gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!editingBlock) return;
    setIsSaving(true);
    setError('');
    try {
      await removeScheduleBlock(editingBlock.clientId);
      setScheduleBlocks(await loadCachedScheduleBlocks());
      setVisible(false);
      setEditingBlock(null);
      setSlot(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Jadwal gagal dihapus.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    visible,
    editingBlock,
    slot,
    label,
    color,
    durationHours,
    colors: SCHEDULE_COLORS,
    error,
    isSaving,
    setLabel,
    setColor,
    setDurationHours,
    open,
    close,
    save,
    remove,
  };
}
