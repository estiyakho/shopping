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
import { ShoppingItemFormModal } from "@/components/task-form-modal";
import { ShoppingItemCard } from "@/components/task-item";
import { MonthSelectionSheet } from "@/components/month-selection-sheet";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useShoppingStore } from "@/store/use-task-store";
import { ShoppingItem, ShoppingItemStatus } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "Active", value: "todo" },
  { label: "Done", value: "done" },
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

  const items = useShoppingStore((state) => state.tasks);
  const categories = useShoppingStore((state) => state.categories);
  const setItemStatus = useShoppingStore((state) => state.toggleItemStatus);
  const deleteItem = useShoppingStore((state) => state.deleteItem);
  const reorderItems = useShoppingStore((state) => state.reorderItems);
  const timeFormat = useShoppingStore((state) => state.settings.timeFormat);

  const initialCategory = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const getInitialFilteredItems = useCallback((filter: string, catId: string, q: string, mode: SortMode, month: Date) => {
    const normalizedQuery = q.trim().toLowerCase();
    const result = items.filter((item) => {
      const matchesStatus = item.status === filter;
      
      const itemDate = new Date(item.createdAt);
      const matchesDate = itemDate.getMonth() === month.getMonth() && 
                         itemDate.getFullYear() === month.getFullYear();

      const matchesCategory = catId === "all" ? true : item.categoryId === catId;
      const matchesQuery = !normalizedQuery || item.title.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesDate && matchesCategory && matchesQuery;
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
  }, [items]);

  const [activeFilter, setActiveFilter] = useState<string>("todo");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);
  
  const [listData, setListData] = useState<ShoppingItem[]>(() => getInitialFilteredItems("todo", "all", "", "manual", new Date()));
  const justDragged = useRef(false);

  useLayoutEffect(() => {
    if (initialCategory) {
      setSelectedCategoryId(initialCategory);
    }
  }, [initialCategory]);

  const filteredItems = useMemo(() => 
    getInitialFilteredItems(activeFilter, selectedCategoryId, query, sortMode, selectedMonth),
    [getInitialFilteredItems, activeFilter, selectedCategoryId, query, sortMode, selectedMonth]
  );

  useEffect(() => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setListData(filteredItems);
  }, [filteredItems]);

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
      deleteItem(id);
    },
    [deleteItem],
  );

  const handleToggle = useCallback(
    (id: string) => {
      runListAnimation();
      setItemStatus(id);
    },
    [setItemStatus],
  );

  const handleEdit = useCallback(
    (item: ShoppingItem) => {
      setEditingItem(item);
    },
    [],
  );


  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ShoppingItem>) => (
      <View style={{ paddingBottom: 12 }}>
        <VerticalScaleDecorator activeScale={1.03}>
          <ShoppingItemCard
            item={item}
            category={
              item.categoryId ? categoryMap.get(item.categoryId) : undefined
            }
            timeFormat={timeFormat}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onLongPress={!isActive ? drag : undefined}
          />
        </VerticalScaleDecorator>
      </View>
    ),
    [categoryMap, handleDelete, handleToggle, handleEdit, timeFormat],
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: colors.background }]}>
        <DraggableFlatList
          onDragEnd={({ data }) => {
            justDragged.current = true;
            setListData(data);
            setSortMode("manual");
            reorderItems(data.map(t => t.id));
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
                  placeholder="Search Item"
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
                  onPress={() => {
                    setMonthSheetVisible(true);
                  }}
                  style={[
                    styles.monthIsland,
                    { 
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border
                    },
                  ]}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={16} 
                    color={colors.textSoft} 
                  />
                  <Text 
                    style={[
                      styles.monthIslandText, 
                      { color: colors.textSoft }
                    ]}
                  >
                    {selectedMonth.toLocaleDateString(undefined, { month: 'short' })}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textSoft} />
                </Pressable>

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
                  ? `No Active items in ${selectedMonth.toLocaleDateString(undefined, { month: 'long' })}`
                  : `No Purchased items in ${selectedMonth.toLocaleDateString(undefined, { month: 'long' })}`
              }
              description="Keep adding items to see them here."
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />

        <FloatingActionButton onPress={() => setAddItemModalVisible(true)} />
      </View>

      <MonthSelectionSheet
        visible={monthSheetVisible}
        selectedValue={selectedMonth}
        onClose={() => setMonthSheetVisible(false)}
        onSelect={(date: Date) => {
          runListAnimation();
          setSelectedMonth(date);
          setMonthSheetVisible(false);
        }}
      />

      <SettingsOptionSheet
        visible={sortSheetVisible}
        title="Sort Items"
        iconName="swap-vertical-outline"
        options={SORT_OPTIONS}
        selectedValue={sortMode}
        onClose={() => setSortSheetVisible(false)}
        onSelect={setSortMode}
      />

      <ShoppingItemFormModal
        visible={addItemModalVisible || !!editingItem}
        initialItem={editingItem}
        defaultCategoryId={
          selectedCategoryId !== "all" ? selectedCategoryId : undefined
        }
        onClose={() => {
          setAddItemModalVisible(false);
          setEditingItem(undefined);
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
  monthIsland: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  monthIslandText: {
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
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
