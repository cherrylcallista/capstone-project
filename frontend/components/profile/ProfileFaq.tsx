import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type FAQItem = {
  id: string;
  title: string;
  description: string;
  steps: string[];
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    title: 'Matriks Eisenhower',
    description: 'Matriks Eisenhower adalah metode manajemen waktu untuk memprioritaskan tugas berdasarkan tingkat kepentingan dan urgensinya.',
    steps: ['Satu', 'Dua', 'Tiga'],
  },
  {
    id: '2',
    title: 'Text here',
    description: 'Deskripsi bantuan tambahan dapat diletakkan di sini.',
    steps: ['Langkah A', 'Langkah B'],
  },
  {
    id: '3',
    title: 'Text here',
    description: 'Deskripsi bantuan tambahan dapat diletakkan di sini.',
    steps: ['Langkah 1', 'Langkah 2'],
  },
];

export function ProfileFaq() {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Bantuan</Text>
      <View style={styles.list}>
        {FAQ_ITEMS.map((item) => {
          const isExpanded = expandedFaqId === item.id;
          return (
            <View key={item.id} style={styles.wrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.header, isExpanded && styles.expandedHeader]}
                onPress={() => setExpandedFaqId(isExpanded ? null : item.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
              >
                <Text style={styles.title}>{item.title}</Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.body}>
                  <View style={styles.divider} />
                  <Text style={styles.description}>{item.description}</Text>
                  <View style={styles.steps}>
                    <Text style={styles.stepsTitle}>Cara Penggunaan:</Text>
                    {item.steps.map((step, index) => (
                      <Text key={step} style={styles.step}>{index + 1}. {step}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  section: { marginBottom: 28 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 14 },
  list: { gap: 12 },
  wrapper: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18 },
  expandedHeader: { paddingBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  body: { paddingHorizontal: 18, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  description: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.textSecondary, marginBottom: 12 },
  steps: { gap: 4 },
  stepsTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  step: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.textSecondary, paddingLeft: 6 },
});
