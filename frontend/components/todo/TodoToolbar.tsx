import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { SORT_OPTIONS, type TaskSortOrder } from '@/features/todo/useTodoTasks';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TodoToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  sortOrder: TaskSortOrder;
  onSortChange: (value: TaskSortOrder) => void;
  sortMenuOpen: boolean;
  onSortMenuChange: (open: boolean) => void;
};

export function TodoToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortOrder,
  onSortChange,
  sortMenuOpen,
  onSortMenuChange,
}: TodoToolbarProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const activeSortLabel = SORT_OPTIONS.find((option) => option.value === sortOrder)?.label ?? 'Terbaru';

  return (
    <>
      <View style={styles.searchSortContainer}>
        <View style={styles.searchSortRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari tugas..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')} accessibilityLabel="Hapus pencarian">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => onSortMenuChange(!sortMenuOpen)}
            accessibilityLabel={`Urutkan tugas: ${activeSortLabel}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: sortMenuOpen }}
          >
            <Ionicons name="swap-vertical" size={17} color={colors.textMuted} />
            <Text style={styles.sortButtonLabel}>{activeSortLabel}</Text>
          </TouchableOpacity>
        </View>
        {sortMenuOpen && (
          <View style={styles.headerMenu}>
            <Text style={styles.menuTitle}>Urutkan tugas</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.menuItem}
                onPress={() => {
                  onSortChange(option.value);
                  onSortMenuChange(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: sortOrder === option.value }}
              >
                <Text style={[styles.menuItemText, sortOrder === option.value && styles.menuItemTextSelected]}>
                  {option.label === 'Terbaru' ? 'Paling baru' : option.label === 'Terlama' ? 'Paling lama' : option.label}
                </Text>
                {sortOrder === option.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
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
            onPress={() => onCategoryChange(category)}
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
    </>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  searchSortContainer: { position: 'relative', zIndex: 5, marginBottom: 16 },
  searchSortRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', padding: 3, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.035, shadowRadius: 6, elevation: 1 },
  headerMenu: { position: 'absolute', top: 60, right: 0, width: 190, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, elevation: 8, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 14 },
  menuTitle: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 5, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted },
  menuItem: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderRadius: 10 },
  menuItemText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  menuItemTextSelected: { fontWeight: '700', color: colors.primary },
  searchBox: { flex: 1, minWidth: 0, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, minWidth: 0, padding: 0, fontSize: 14, color: colors.text },
  sortButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.inputBackground },
  sortButtonLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  categoryScroller: { height: 48, flexGrow: 0, marginBottom: 20 },
  categories: { gap: 10, paddingVertical: 2, alignItems: 'center' },
  category: { height: 42, minWidth: 92, maxWidth: 180, flexShrink: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selectedCategory: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryLabel: { maxWidth: 145, fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  selectedCategoryLabel: { color: colors.onPrimary },
});
