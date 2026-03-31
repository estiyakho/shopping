import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryFormModal } from "@/components/category-form-modal";
import { EmptyState } from "@/components/empty-state";
import { FloatingActionButton } from "@/components/floating-action-button";
import { SettingsOptionSheet } from "@/components/settings-option-sheet";
import { TaskFormModal } from "@/components/task-form-modal";
import { TaskItem } from "@/components/task-item";
import { VerticalScaleDecorator } from "@/components/vertical-scale-decorator";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { Task, TaskStatus } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" as const },
  { label: "Oldest First", value: "oldest" as const },
  { label: "Title A-Z", value: "title-asc" as const },
  { label: "Title Z-A", value: "title-desc" as const },
];

type SortMode = (typeof SORT_OPTIONS)[number]["value"] | "manual";
type CategoryTaskFilter = "all" | TaskStatus;

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const categories = useTaskStore((state) => state.categories);
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const setTaskNotAvailable = useTaskStore(
    (state) => state.setTaskNotAvailable,
  );
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const archiveCategory = useTaskStore((state) => state.archiveCategory);
  const unarchiveCategory = useTaskStore((state) => state.unarchiveCategory);
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<CategoryTaskFilter>("todo");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  const categoryId = Array.isArray(params.id) ? params.id[0] : params.id || "";
  const category = categories.find((item) => item.id === categoryId);

  const categoryTasks = useMemo(() => {
    if (!categoryId) return [];
    const defaultFiltered = tasks.filter(
      (task) => task.categoryId === categoryId,
    );
    let result = defaultFiltered;

    if (taskFilter !== "all") {
      result = defaultFiltered.filter((task) => task.status === taskFilter);
    }

    result.sort((left, right) => {
      if (sortMode === "manual") {
        return (right.orderIndex ?? 0) - (left.orderIndex ?? 0);
      }
      if (sortMode === "newest") {
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      }
      if (sortMode === "oldest") {
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      }
      if (sortMode === "title-asc") {
        return left.title.localeCompare(right.title);
      }
      return right.title.localeCompare(left.title);
    });

    return result;
  }, [categoryId, taskFilter, sortMode, tasks]);

  const [listData, setListData] = useState<Task[]>(categoryTasks);
  const justDragged = useRef(false);

  useEffect(() => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setListData(categoryTasks);
  }, [categoryTasks]);

  const availableTasks = tasks.filter(
    (task) => task.categoryId === categoryId && task.status !== "not-available",
  );
  const totalTasks = availableTasks.length;
  const completedTasks = availableTasks.filter(
    (task) => task.status === "done",
  ).length;
  const remainingTasks = totalTasks - completedTasks;

  const handleDelete = useCallback(
    (id: string) => {
      runListAnimation();
      deleteTask(id);
    },
    [deleteTask],
  );

  const handleToggle = useCallback(
    (id: string) => {
      runListAnimation();
      toggleTaskStatus(id);
    },
    [toggleTaskStatus],
  );

  const handleNotAvailable = useCallback(
    (id: string) => {
      runListAnimation();
      setTaskNotAvailable(id);
    },
    [setTaskNotAvailable],
  );

  if (!category || !categoryId) {
    return (
      <View
        style={[
          styles.safeArea,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 100,
            }}
          >
            <EmptyState
              title="Category not found"
              description="This category may have been removed or the link is invalid."
            />
          </View>
        </View>
      </View>
    );
  }

  const renderTask = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => (
      <View style={{ paddingBottom: 12 }}>
        <VerticalScaleDecorator activeScale={1.03}>
          <TaskItem
            task={item}
            category={{ color: category.color, name: category.name }}
            timeFormat={timeFormat}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onEdit={(task) => setEditingTask(task)}
            onLongPress={!isActive ? drag : undefined}
            onNotAvailable={handleNotAvailable}
          />
        </VerticalScaleDecorator>
      </View>
    ),
    [
      category.color,
      category.name,
      timeFormat,
      handleDelete,
      handleToggle,
      handleNotAvailable,
    ],
  );

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 6),
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text
              style={[styles.categoryName, { color: colors.text }]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setEditModalVisible(true)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="settings-outline" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>



        <DraggableFlatList
          onDragEnd={({ data }) => {
            justDragged.current = true;
            setListData(data);
            setSortMode("manual");
            reorderTasks(data.map((t) => t.id));
          }}
          ListHeaderComponent={
            <View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.summaryTop}>
                  <View
                    style={[
                      styles.categoryIconWrap,
                      { backgroundColor: `${category.color}22` },
                    ]}
                  >
                    <Ionicons name="bookmark" size={24} color={category.color} />
                  </View>
                  <View style={styles.summaryMain}>
                    <View style={styles.progressRow}>
                      <Text
                        style={[styles.progressText, { color: colors.text }]}
                      >
                        {progress}% Done
                      </Text>
                      <Text
                        style={[
                          styles.progressCount,
                          { color: colors.textMuted },
                        ]}
                      >
                        {completedTasks}/{totalTasks}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.progressBarTrack,
                        { backgroundColor: colors.surfaceMuted },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: category.color,
                            width: `${progress}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {remainingTasks}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: colors.textMuted }]}
                    >
                      Remaining
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {completedTasks}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: colors.textMuted }]}
                    >
                      Done
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.filterBar}>
                <View
                  style={[
                    styles.chips,
                    { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  {(["todo", "done", "not-available"] as const).map(
                    (filter) => {
                      const active = taskFilter === filter;
                      return (
                        <Pressable
                          key={filter}
                          onPress={() => {
                            runListAnimation();
                            setTaskFilter(filter);
                          }}
                          style={[
                            styles.chipBtn,
                            active && {
                              backgroundColor: colors.surfaceElevated,
                              borderColor: colors.border,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: active ? colors.text : colors.textMuted,
                              },
                            ]}
                          >
                            {filter === "todo"
                              ? "Doing"
                              : filter === "done"
                                ? "Done"
                                : "N/A"}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>

                <Pressable
                  onPress={() => setSortSheetVisible(true)}
                  style={[
                    styles.sortBtn,
                    { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={[styles.sortText, { color: colors.text }]}>
                    Sort
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(92, insets.bottom + 80) },
          ]}
          data={listData}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title={
                taskFilter === "todo"
                  ? "Nothing to do"
                  : taskFilter === "done"
                    ? "No finished tasks"
                    : "N/A"
              }
              description={
                taskFilter === "todo"
                  ? "Tasks you need to work on will appear here."
                  : taskFilter === "done"
                    ? "Finished tasks will appear here."
                    : "Task that are not available today will appear here."
              }
            />
          }
          renderItem={renderTask}
        />

        <FloatingActionButton onPress={() => setIsAddingTask(true)} />

        <CategoryFormModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          initialCategory={category}
        />

        <TaskFormModal
          visible={isAddingTask || !!editingTask}
          onClose={() => {
            setIsAddingTask(false);
            setEditingTask(undefined);
          }}
          initialTask={editingTask}
          defaultCategoryId={categoryId}
        />

        <SettingsOptionSheet
          visible={sortSheetVisible}
          title="Sort Todos"
          iconName="swap-vertical"
          options={SORT_OPTIONS}
          selectedValue={sortMode}
          onClose={() => setSortSheetVisible(false)}
          onSelect={(val) => {
            runListAnimation();
            setSortMode(val as SortMode);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  categoryName: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryMain: {
    flex: 1,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  progressCount: {
    fontFamily: AppFonts.medium,
    fontSize: 12,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 16,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: AppFonts.medium,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  chips: {
    flex: 1,
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  chipText: {
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sortText: {
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 20,
  },
});
