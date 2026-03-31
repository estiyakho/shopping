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
import { ShoppingItemFormModal } from "@/components/task-form-modal";
import { ShoppingItemCard } from "@/components/task-item";
import { VerticalScaleDecorator } from "@/components/vertical-scale-decorator";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useShoppingStore } from "@/store/use-task-store";
import { ShoppingItem, ShoppingItemStatus } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" as const },
  { label: "Oldest First", value: "oldest" as const },
  { label: "Title A-Z", value: "title-asc" as const },
  { label: "Title Z-A", value: "title-desc" as const },
];

type SortMode = (typeof SORT_OPTIONS)[number]["value"] | "manual";
type CategoryItemFilter = "all" | ShoppingItemStatus;

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const categories = useShoppingStore((state) => state.categories);
  const items = useShoppingStore((state) => state.tasks);
  const toggleItemStatus = useShoppingStore((state) => state.toggleItemStatus);
  const deleteItem = useShoppingStore((state) => state.deleteItem);
  const setItemNotAvailable = useShoppingStore(
    (state) => state.setItemNotAvailable,
  );
  const reorderItems = useShoppingStore((state) => state.reorderItems);
  const archiveCategory = useShoppingStore((state) => state.archiveCategory);
  const unarchiveCategory = useShoppingStore((state) => state.unarchiveCategory);
  const timeFormat = useShoppingStore((state) => state.settings.timeFormat);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemFilter, setItemFilter] = useState<CategoryItemFilter>("todo");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  const categoryId = Array.isArray(params.id) ? params.id[0] : params.id || "";
  const category = categories.find((item) => item.id === categoryId);

  const categoryItems = useMemo(() => {
    if (!categoryId) return [];
    const defaultFiltered = items.filter(
      (item) => item.categoryId === categoryId,
    );
    let result = defaultFiltered;

    if (itemFilter !== "all") {
      result = defaultFiltered.filter((item) => item.status === itemFilter);
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
  }, [categoryId, itemFilter, sortMode, items]);

  const [listData, setListData] = useState<ShoppingItem[]>(categoryItems);
  const justDragged = useRef(false);

  useEffect(() => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setListData(categoryItems);
  }, [categoryItems]);

  const availableItems = items.filter(
    (item) => item.categoryId === categoryId && item.status !== "not-available",
  );
  const totalItems = availableItems.length;
  const completedItems = availableItems.filter(
    (item) => item.status === "done",
  ).length;
  const remainingItems = totalItems - completedItems;

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
      toggleItemStatus(id);
    },
    [toggleItemStatus],
  );

  const handleNotAvailable = useCallback(
    (id: string) => {
      runListAnimation();
      setItemNotAvailable(id);
    },
    [setItemNotAvailable],
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

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ShoppingItem>) => (
      <View style={{ paddingBottom: 12 }}>
        <VerticalScaleDecorator activeScale={1.03}>
          <ShoppingItemCard
            item={item}
            category={{ color: category.color, name: category.name }}
            timeFormat={timeFormat}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onEdit={(item) => setEditingItem(item)}
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
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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
            reorderItems(data.map((t) => t.id));
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
                        {completedItems}/{totalItems}
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
                      {remainingItems}
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
                      {completedItems}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: colors.textMuted }]}
                    >
                      Purchased
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
                      const active = itemFilter === filter;
                      return (
                        <Pressable
                          key={filter}
                          onPress={() => {
                            runListAnimation();
                            setItemFilter(filter);
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
                              ? "Active"
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
                itemFilter === "todo"
                  ? "Nothing to buy"
                  : itemFilter === "done"
                    ? "No finished purchases"
                    : "N/A"
              }
              description={
                itemFilter === "todo"
                  ? "Things you need to buy will appear here."
                  : itemFilter === "done"
                    ? "Finished purchases will appear here."
                    : "Things that are not available today will appear here."
              }
            />
          }
          renderItem={renderItem}
        />

        <FloatingActionButton onPress={() => setIsAddingItem(true)} />

        <CategoryFormModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          initialCategory={category}
        />

        <ShoppingItemFormModal
          visible={isAddingItem || !!editingItem}
          onClose={() => {
            setIsAddingItem(false);
            setEditingItem(undefined);
          }}
          initialItem={editingItem}
          defaultCategoryId={categoryId}
        />

        <SettingsOptionSheet
          visible={sortSheetVisible}
          title="Sort Items"
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
