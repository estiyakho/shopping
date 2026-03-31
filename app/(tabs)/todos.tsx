import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";

import { EmptyState } from "@/components/empty-state";
import { VerticalScaleDecorator } from "@/components/vertical-scale-decorator";
import { FloatingActionButton } from "@/components/floating-action-button";
import { SettingsOptionSheet } from "@/components/settings-option-sheet";
import { TaskFormModal } from "@/components/task-form-modal";
import { TaskItem } from "@/components/task-item";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { Task, TaskStatus } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";

const FILTER_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "Doing", value: "todo" },
  { label: "Done", value: "done" },
  { label: "N/A", value: "not-available" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" as const },
  { label: "Oldest First", value: "oldest" as const },
  { label: "Title A-Z", value: "title-asc" as const },
  { label: "Title Z-A", value: "title-desc" as const },
];

type SortMode = (typeof SORT_OPTIONS)[number]["value"] | "manual";

export default function TodosScreen() {
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();

  const tasks = useTaskStore((state) => state.tasks);
  const categories = useTaskStore((state) => state.categories);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const setTaskNotAvailable = useTaskStore((state) => state.setTaskNotAvailable);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);

  const initialCategory = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const getInitialFilteredTasks = useCallback((filter: TaskStatus, catId: string, q: string, mode: SortMode) => {
    const normalizedQuery = q.trim().toLowerCase();
    const result = tasks.filter((task) => {
      const matchesStatus = task.status === filter;
      const matchesCategory = catId === "all" ? true : task.categoryId === catId;
      const matchesQuery = !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesCategory && matchesQuery;
    });

    result.sort((left, right) => {
      if (mode === "manual") {
        return (right.orderIndex ?? 0) - (left.orderIndex ?? 0);
      }
      if (mode === "newest") return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      if (mode === "oldest") return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      if (mode === "title-asc") return left.title.localeCompare(right.title);
      return right.title.localeCompare(left.title);
    });
    return result;
  }, [tasks]);

  const [activeFilter, setActiveFilter] = useState<TaskStatus>("todo");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const [listData, setListData] = useState<Task[]>(() => getInitialFilteredTasks("todo", "all", "", "manual"));
  const justDragged = useRef(false);

  useLayoutEffect(() => {
    if (initialCategory) {
      setSelectedCategoryId(initialCategory);
    }
  }, [initialCategory]);

  const filteredTasks = useMemo(() => 
    getInitialFilteredTasks(activeFilter, selectedCategoryId, query, sortMode),
    [getInitialFilteredTasks, activeFilter, selectedCategoryId, query, sortMode]
  );

  useEffect(() => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setListData(filteredTasks);
  }, [filteredTasks]);

  const categoryMap = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          {
            color: category.color,
            name: category.name,
          },
        ]),
      ),
    [categories],
  );

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

  const handleEdit = useCallback(
    (task: Task) => {
      setEditingTask(task);
    },
    [],
  );

  const handleNotAvailable = useCallback(
    (id: string) => {
      runListAnimation();
      setTaskNotAvailable(id);
    },
    [setTaskNotAvailable],
  );

  const renderTask = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => (
      <View style={{ paddingBottom: 12 }}>
        <VerticalScaleDecorator activeScale={1.03}>
          <TaskItem
            task={item}
            category={
              item.categoryId ? categoryMap.get(item.categoryId) : undefined
            }
            timeFormat={timeFormat}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onNotAvailable={handleNotAvailable}
            onEdit={handleEdit}
            onLongPress={!isActive ? drag : undefined}
          />
        </VerticalScaleDecorator>
      </View>
    ),
    [categoryMap, handleDelete, handleToggle, handleEdit, timeFormat, handleNotAvailable],
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: colors.background }]}>
        <DraggableFlatList
          onDragEnd={({ data }) => {
            justDragged.current = true;
            setListData(data);
            setSortMode("manual");
            reorderTasks(data.map(t => t.id));
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(92, insets.bottom + 80) }]}
          data={listData}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ paddingTop: 6 }}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons color={colors.textMuted} name="search-outline" size={24} />
                <TextInput
                  onChangeText={setQuery}
                  placeholder="Search Todo"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.searchInput, { color: colors.text }]}
                  value={query}
                />
              </View>

              <View style={styles.filterBar}>
                <View style={[styles.chips, { backgroundColor: colors.surfaceElevated }]}>
                  {FILTER_OPTIONS.map((option) => {
                    const active = option.value === activeFilter;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          runListAnimation();
                          setActiveFilter(option.value);
                        }}
                        style={[
                          styles.chipBtn,
                          active && { backgroundColor: colors.accent },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? (colors.isLight ? '#0F172A' : '#F8FAFC') : colors.textMuted },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => setSortSheetVisible(true)}
                  style={[
                    styles.sortBtn,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={16}
                    color={colors.textSoft}
                  />
                  <Text style={[styles.sortText, { color: colors.textSoft }]}>Sort</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                disallowInterruption={true}
                contentContainerStyle={styles.chipsContent}
                style={[styles.chipsRow, { width: '100%' }]}
              >
                <Pressable
                  onPress={() => setSelectedCategoryId("all")}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedCategoryId === "all"
                          ? colors.accent
                          : colors.surfaceMuted,
                      borderColor:
                        selectedCategoryId === "all" ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selectedCategoryId === "all" ? (colors.isLight ? '#0F172A' : '#F8FAFC') : colors.textSoft }]}>All</Text>
                </Pressable>
                {categories.filter((c) => !c.isArchived).map((category) => {
                  const active = selectedCategoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setSelectedCategoryId(category.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? category.color : colors.surfaceMuted,
                          borderColor: active ? category.color : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? (colors.isLight ? '#0F172A' : '#F8FAFC') : colors.textSoft }]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={
                activeFilter === "todo" 
                  ? "Add a Todo" 
                  : activeFilter === "done" 
                    ? "Finished Tasks" 
                    : "Not Available"
              }
              description={
                activeFilter === "todo"
                  ? "Create a to do to get started."
                  : activeFilter === "done"
                    ? "Finished tasks will appear here."
                    : "Tasks that are not available today are here."
              }
            />
          }
          renderItem={renderTask}
          showsVerticalScrollIndicator={false}
        />

        <FloatingActionButton onPress={() => setAddTaskModalVisible(true)} />
      </View>

      <SettingsOptionSheet
        visible={sortSheetVisible}
        title="Sort Todos"
        iconName="swap-vertical-outline"
        options={SORT_OPTIONS}
        selectedValue={sortMode}
        onClose={() => setSortSheetVisible(false)}
        onSelect={setSortMode}
      />

      <TaskFormModal
        visible={addTaskModalVisible || !!editingTask}
        initialTask={editingTask}
        defaultCategoryId={
          selectedCategoryId !== "all" ? selectedCategoryId : undefined
        }
        onClose={() => {
          setAddTaskModalVisible(false);
          setEditingTask(undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  searchBar: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    marginLeft: 10,
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
  chipsRow: {
    marginBottom: 16,
    maxHeight: 50,
  },
  chipsContent: {
    alignItems: "center",
    gap: 10,
    paddingRight: 12,
  },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 42,
    minWidth: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 2,
  },
});
