import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CategoryFormModal } from '@/components/category-form-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
import { ModernConfirmationModal } from '@/components/modern-confirmation-modal';
import { VerticalScaleDecorator } from '@/components/vertical-scale-decorator';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { runListAnimation } from '@/utils/layout-animation';

function ProgressRing({ progress, color, labelColor, baseColor }: { progress: number; color: string; labelColor: string; baseColor: string }) {
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={baseColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clampedProgress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <Text style={[styles.ringText, { color: labelColor }]}>{clampedProgress}%</Text>
      </View>
    </View>
  );
}

type CategoryItemProps = {
  item: any;
  drag: () => void;
  isActive: boolean;
  onPress: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  activeTab: 'active' | 'archived';
  colors: any;
};

const CategoryItem = memo(({ item, drag, isActive, onPress, onArchive, onUnarchive, onDelete, activeTab, colors }: CategoryItemProps) => {
  return (
    <View style={{ paddingBottom: 10 }}>
      <VerticalScaleDecorator activeScale={1.04}>
        <Pressable
          onLongPress={!isActive ? drag : undefined}
          delayLongPress={200}
          onPress={() => onPress(item.id)}
          style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.cardLeft}>
            <ProgressRing color={item.color} progress={item.progress} labelColor={colors.text} baseColor={colors.border} />
            <View style={styles.cardTextWrap}>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text numberOfLines={2} style={[styles.cardMeta, { color: colors.textMuted }]}>
                {item.description || (item.remaining > 0 ? `${item.remaining} task${item.remaining > 1 ? 's' : ''} left` : 'All tasks completed')}
              </Text>
            </View>
          </View>

          <View style={styles.actionArea}>
            <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.countText, { color: colors.text }]}>{item.completed}/{item.total}</Text>
            </View>

            {activeTab === 'active' ? (
              <Pressable onPress={() => onArchive(item.id)} style={[styles.actionIconPill, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="archive-outline" size={18} color={colors.textSoft} />
              </Pressable>
            ) : (
              <View style={styles.archivedActions}>
                <Pressable onPress={() => onUnarchive(item.id)} style={[styles.actionIconPill, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="refresh-outline" size={18} color={colors.textSoft} />
                </Pressable>
                <Pressable onPress={() => onDelete(item.id)} style={[styles.actionIconPill, { backgroundColor: `${colors.danger}20` }]}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </VerticalScaleDecorator>
    </View>
  );
}, (prev, next) => {
  return (
    prev.isActive === next.isActive &&
    prev.activeTab === next.activeTab &&
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.description === next.item.description &&
    prev.item.color === next.item.color &&
    prev.item.progress === next.item.progress &&
    prev.item.completed === next.item.completed &&
    prev.item.total === next.item.total &&
    prev.item.isArchived === next.item.isArchived &&
    prev.colors === next.colors
  );
});

type CategoryTab = 'active' | 'archived';

export default function CategoriesScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const categories = useTaskStore((state) => state.categories);
  const tasks = useTaskStore((state) => state.tasks);
  const reorderCategories = useTaskStore((state) => state.reorderCategories);

  const categorySummaries = useMemo(() => {
    return categories.map((category) => {
      const relatedTasks = tasks.filter((task) => task.categoryId === category.id && task.status !== 'not-available');
      const completed = relatedTasks.filter((task) => task.status === 'done').length;
      const progress = relatedTasks.length ? Math.round((completed / relatedTasks.length) * 100) : 0;

      return {
        ...category,
        total: relatedTasks.length,
        completed,
        remaining: relatedTasks.length - completed,
        progress,
      };
    });
  }, [categories, tasks]);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('active');

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const results = categorySummaries.filter((category) => {
      const matchesTab = activeTab === 'active' ? !category.isArchived : category.isArchived;
      const matchesQuery =
        !normalizedQuery ||
        category.name.toLowerCase().includes(normalizedQuery) ||
        category.description?.toLowerCase().includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });

    return results.sort((a, b) => {
      const orderA = a.orderIndex ?? new Date(a.createdAt).getTime();
      const orderB = b.orderIndex ?? new Date(b.createdAt).getTime();
      return orderB - orderA;
    });
  }, [activeTab, categorySummaries, query]);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [listData, setListData] = useState<typeof filteredCategories>(filteredCategories);
  const justDragged = useRef(false);

  useEffect(() => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setListData(filteredCategories);
  }, [filteredCategories]);

  const availableTasks = tasks.filter((task) => task.status !== 'not-available');
  const totalTasks = availableTasks.length;
  const completedTasks = availableTasks.filter((task) => task.status === 'done').length;
  const remainingTasks = totalTasks - completedTasks;
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const archiveCategory = useTaskStore((state) => state.archiveCategory);
  const unarchiveCategory = useTaskStore((state) => state.unarchiveCategory);
  const deleteCategory = useTaskStore((state) => state.deleteCategory);

  const handleArchive = useCallback((id: string) => {
    runListAnimation();
    archiveCategory(id);
  }, [archiveCategory]);

  const handleUnarchive = useCallback((id: string) => {
    runListAnimation();
    unarchiveCategory(id);
  }, [unarchiveCategory]);

  const executeDelete = () => {
    if (categoryToDelete) {
      runListAnimation();
      deleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    }
  };

  const handlePress = useCallback((id: string) => {
    router.push({ pathname: '/category/[id]', params: { id } });
  }, [router]);

  const renderCategory = useCallback(
    ({ item, drag, isActive }: RenderItemParams<typeof filteredCategories[0]>) => (
      <CategoryItem
        item={item}
        drag={drag}
        isActive={isActive}
        onPress={handlePress}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onDelete={setCategoryToDelete}
        activeTab={activeTab}
        colors={colors}
      />
    ),
    [colors, activeTab, handlePress, handleArchive, handleUnarchive]
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons color={colors.textMuted} name="search-outline" size={24} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search Category"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.summaryTop}>
            <View style={[styles.summaryIconWrap, { backgroundColor: `${colors.accent}CC` }]}>
              <Ionicons color="#F8FAFC" name="flag-outline" size={22} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Let&apos;s start!</Text>
              <Text style={[styles.summarySubtitle, { color: colors.textMuted }]}>All Todos progress</Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${overallProgress}%` }]} />
            </View>
            <Text style={[styles.progressValue, { color: colors.accent }]}>{overallProgress}%</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Ionicons color={colors.accent} name="checkmark-circle-outline" size={16} />
              <Text style={[styles.statText, { color: colors.text }]}>{completedTasks} Completed</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Ionicons color={colors.warning} name="list-outline" size={16} />
              <Text style={[styles.statText, { color: colors.text }]}>{remainingTasks} Remaining</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          <Pressable onPress={() => setActiveTab('active')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, { color: activeTab === 'active' ? colors.text : colors.textMuted }]}>Active</Text>
            {activeTab === 'active' ? <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} /> : null}
          </Pressable>
          <Pressable onPress={() => setActiveTab('archived')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, { color: activeTab === 'archived' ? colors.text : colors.textMuted }]}>Archived</Text>
            {activeTab === 'archived' ? <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} /> : null}
          </Pressable>
        </View>

        <DraggableFlatList
          onDragEnd={({ data }) => {
            justDragged.current = true;
            setListData(data);
            reorderCategories(data.map(c => c.id));
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(92, insets.bottom + 80) }]}
          data={listData}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={renderCategory}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'active' ? 'No categories yet' : 'Archive is empty'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeTab === 'active'
                  ? 'Add category to organize todos.'
                  : 'An item not currently needed may be stored here. It can become useful in the future.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <FloatingActionButton iconName="add" onPress={() => setCategoryModalVisible(true)} />
      </View>
      <CategoryFormModal visible={categoryModalVisible} onClose={() => setCategoryModalVisible(false)} />
      <ModernConfirmationModal
        visible={!!categoryToDelete}
        title="Delete Category?"
        message="This will permanently delete this category and all its tasks."
        onClose={() => setCategoryToDelete(null)}
        onConfirm={executeDelete}
        confirmText="Delete"
        tone="danger"
        iconName="trash-bin-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 12 },
  searchBar: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    marginLeft: 10,
    paddingVertical: 0,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  summaryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryIconWrap: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginRight: 12,
    width: 56,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  progressTrack: {
    borderRadius: 999,
    flex: 1,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressValue: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginLeft: 12,
    minWidth: 46,
    textAlign: 'right',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 10,
  },
  statText: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  tabButton: {
    paddingBottom: 8,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
  tabIndicator: {
    borderRadius: 999,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    width: 52,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  cardTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  cardTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 15,
    marginBottom: 4,
  },
  cardMeta: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  countPill: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 52,
    paddingHorizontal: 8,
  },
  countText: {
    fontFamily: AppFonts.bold,
    fontSize: 14,
  },
  ringWrap: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    position: 'relative',
    width: 64,
  },
  ringText: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 28,
  },
  emptyTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  actionArea: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionIconPill: {
    alignItems: 'center',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  archivedActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
