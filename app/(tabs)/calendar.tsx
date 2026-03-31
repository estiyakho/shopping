import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    runOnJS,
    SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingActionButton } from "@/components/floating-action-button";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { getMonthGrid, getWeekdayLabels } from "@/utils/calendar";
import { formatMonthLabel, toDayKey } from "@/utils/date";

const GRID_COLUMNS = 7;
const GRID_GAP = 6;
const CARD_HORIZONTAL_PADDING = 28;

function readableTextOn(color: string) {
  return "#FFFFFF";
}

export default function CalendarScreen() {
  const { width, height } = useWindowDimensions();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const scheduledTasks = useTaskStore((state) => state.scheduledTasks);
  const deleteScheduledTask = useTaskStore(
    (state) => state.deleteScheduledTask,
  );
  const addScheduledTask = useTaskStore((state) => state.addScheduledTask);
  const updateScheduledTask = useTaskStore(
    (state) => state.updateScheduledTask,
  );
  const settings = useTaskStore((state) => state.settings);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(() => toDayKey(new Date()));
  const [showAll, setShowAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingScheduledTask, setEditingScheduledTask] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useTime, setUseTime] = useState(true);
  const [selectedHour, setSelectedHour] = useState(() => {
    const h = new Date().getHours();
    return h === 0 ? 12 : h > 12 ? h - 12 : h;
  });
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());
  const [period, setPeriod] = useState(() =>
    new Date().getHours() >= 12 ? "PM" : "AM",
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const firstDay = settings?.firstDayOfWeek ?? "sunday";

  const hourScrollRef = useRef<ScrollView>(null);
  const minScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
  const MINUTES = Array.from({ length: 60 }, (_, i) => i);
  const PERIODS = ["AM", "PM"] as const;

  // Multiple sets for "infinite" feeling
  const INFINITE_HOURS = [...HOURS, ...HOURS, ...HOURS];
  const INFINITE_MINUTES = [...MINUTES, ...MINUTES, ...MINUTES];
  const INFINITE_PERIODS = [...PERIODS, ...PERIODS, ...PERIODS];
  const ITEM_HEIGHT = 48; // Final fixed height for items

  // Reset scroll to middle set on mount
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: (selectedHour - 1 + 12) * ITEM_HEIGHT,
          animated: false,
        });
        minScrollRef.current?.scrollTo({
          y: (selectedMinute + 60) * ITEM_HEIGHT,
          animated: false,
        });
        periodScrollRef.current?.scrollTo({
          y: (period === "AM" ? 0 : 1 + 2) * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [showAddModal]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const weekdayLabels = useMemo(() => getWeekdayLabels(firstDay), [firstDay]);
  const todayKey = useMemo(() => toDayKey(new Date()), []);
  const monthGrid = useMemo(
    () => getMonthGrid(currentMonth, firstDay),
    [currentMonth, firstDay],
  );
  const displayGrid = useMemo(() => {
    if (!isCollapsed) return monthGrid;

    const selectedIndex = monthGrid.findIndex(
      (cell) => cell.key === selectedDay,
    );
    if (selectedIndex === -1) return monthGrid.slice(0, 14);

    const startWeekIndex = Math.floor(selectedIndex / 7);
    const startIdx = Math.min(startWeekIndex * 7, 28);
    return monthGrid.slice(startIdx, startIdx + 14);
  }, [monthGrid, isCollapsed, selectedDay]);

  const taskDates = useMemo(
    () => new Set(scheduledTasks.map((task) => task.date)),
    [scheduledTasks],
  );
  const dayTasks = useMemo(() => {
    if (showAll) {
      return [...scheduledTasks].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    }
    return scheduledTasks.filter((task) => task.date === selectedDay);
  }, [selectedDay, scheduledTasks, showAll]);

  const availableGridWidth = width - 14 * 2; // Full width within container padding
  const daySize = Math.floor(
    (availableGridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );

  const handleSaveTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    let timeStr = undefined;
    if (useTime) {
      let h24 = selectedHour === 12 ? 0 : selectedHour;
      if (period === "PM") h24 += 12;
      timeStr = `${h24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}:00`;
    }

    if (editingScheduledTask) {
      updateScheduledTask(editingScheduledTask.id, {
        title: trimmed,
        description,
        date: selectedDay,
        time: timeStr,
      });
    } else {
      addScheduledTask({
        title: trimmed,
        description,
        date: selectedDay,
        time: timeStr,
      });
    }

    resetForm();
    setShowAddModal(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEditingScheduledTask(null);
    setUseTime(true);
  };

  const handleEditReminder = (task: any) => {
    setEditingScheduledTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setSelectedDay(task.date);

    if (task.time) {
      const [h24, m] = task.time.split(":").map(Number);
      const ampm = h24 >= 12 ? "PM" : "AM";
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      setSelectedHour(h12);
      setSelectedMinute(m);
      setPeriod(ampm);
      setUseTime(true);
    } else {
      setUseTime(false);
    }
    setShowAddModal(true);
  };

  const goToNextMonth = () =>
    setCurrentMonth(
      (value) => new Date(value.getFullYear(), value.getMonth() + 1, 1),
    );
  const goToPrevMonth = () =>
    setCurrentMonth(
      (value) => new Date(value.getFullYear(), value.getMonth() - 1, 1),
    );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .activeOffsetY([-20, 20])
    .onEnd((e) => {
      // Horizontal swipe (Month nav)
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        if (e.translationX < -50) {
          runOnJS(goToNextMonth)();
        } else if (e.translationX > 50) {
          runOnJS(goToPrevMonth)();
        }
      }
      // Vertical swipe (Collapse/Expand)
      else {
        if (e.translationY < -50) {
          runOnJS(setIsCollapsed)(true);
        } else if (e.translationY > 50) {
          runOnJS(setIsCollapsed)(false);
        }
      }
    });

  const baseModalMaxHeight = Math.max(
    320,
    height - insets.top - insets.bottom - 48,
  );
  const keyboardAdjustedModalMaxHeight = isKeyboardVisible
    ? Math.max(260, height - insets.top - insets.bottom - keyboardHeight - 80)
    : baseModalMaxHeight;

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: Math.max(insets.top, 8),
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Pressable onPress={goToPrevMonth} style={styles.headerIcon}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
          </View>

          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {formatMonthLabel(currentMonth)}
          </Text>

          <View style={[styles.headerSide, styles.headerSideRight]}>
            <Pressable
              onPress={() => setIsCollapsed(!isCollapsed)}
              style={[
                styles.modePill,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.modeText, { color: colors.textMuted }]}>
                {isCollapsed ? "2 Weeks" : "Month"}
              </Text>
              <Ionicons
                name={isCollapsed ? "chevron-down" : "chevron-up"}
                size={12}
                color={colors.textMuted}
                style={{ marginLeft: 4 }}
              />
            </Pressable>
            <Pressable onPress={goToNextMonth} style={styles.headerIcon}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <GestureDetector gesture={swipeGesture}>
          <Animated.View
            key={`${currentMonth.toISOString()}-${isCollapsed}`}
            layout={LinearTransition.springify().damping(18)}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.calendarLayer}
          >
            <View style={[styles.weekRow, { gap: GRID_GAP }]}>
              {weekdayLabels.map((label) => (
                <Text
                  key={label}
                  style={[
                    styles.weekday,
                    { color: colors.textMuted, width: daySize },
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>

            <View style={[styles.grid, { gap: GRID_GAP }]}>
              {displayGrid.map((cell) => {
                const selected = cell.key === selectedDay;
                const hasTasks = taskDates.has(cell.key);
                const isToday = cell.key === todayKey;
                const labelColor = selected
                  ? readableTextOn(colors.accent)
                  : cell.inCurrentMonth
                    ? colors.text
                    : colors.textMuted;

                return (
                  <Pressable
                    key={cell.key}
                    onPress={() => {
                      setSelectedDay(cell.key);
                      setShowAll(false);
                    }}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: selected
                          ? colors.accent
                          : "transparent",
                        height: daySize * 0.75,
                        width: daySize,
                      },
                    ]}
                  >
                    {isToday && !selected ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.currentDayFill,
                          {
                            backgroundColor: `${colors.accent}66`,
                          },
                        ]}
                      />
                    ) : null}
                    <Text style={[styles.dayNumber, { color: labelColor }]}>
                      {cell.date.getDate()}
                    </Text>
                    {hasTasks ? (
                      <>
                        <View
                          style={[
                            styles.dayDotHalo,
                            {
                              backgroundColor: selected
                                ? `${readableTextOn(colors.accent)}22`
                                : `${colors.accent}22`,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.dayDot,
                            {
                              backgroundColor: selected
                                ? readableTextOn(colors.accent)
                                : colors.accent,
                            },
                          ]}
                        />
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </GestureDetector>

        <View style={styles.sectionHeader}>
          <Pressable
            onPress={() => setShowAll((prev) => !prev)}
            style={[
              styles.allTasksButton,
              {
                backgroundColor: showAll ? colors.accent : colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={showAll ? readableTextOn(colors.accent) : colors.text}
            />
            <Text
              style={[
                styles.allTasksLabel,
                {
                  color: showAll ? readableTextOn(colors.accent) : colors.text,
                },
              ]}
            >
              All reminders
            </Text>
          </Pressable>
          {dayTasks.length ? (
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
              {dayTasks.length}
            </Text>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(100, insets.bottom + 80) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {dayTasks.length ? (
            dayTasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.todoCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.todoHeader}>
                  <Text style={[styles.todoTitle, { color: colors.text }]}>
                    {task.title}
                  </Text>
                  <View style={styles.todoActions}>
                    <Pressable
                      onPress={() => handleEditReminder(task)}
                      style={[
                        styles.editButton,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => deleteScheduledTask(task.id)}
                      style={[
                        styles.skipButton,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.skipText, { color: colors.textSoft }]}
                      >
                        N/A
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteScheduledTask(task.id)}
                      style={[
                        styles.deleteButton,
                        {
                          backgroundColor: `${colors.danger}15`,
                          borderColor: `${colors.danger}30`,
                        },
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                </View>
                {task.description ? (
                  <Text
                    style={[
                      styles.todoDescription,
                      { color: colors.textMuted },
                    ]}
                  >
                    {task.description}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyBlock}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: `${colors.accent}33` },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={34}
                  color={colors.accent}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Add a reminder
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Reminders stay on the calendar with native alerts.
              </Text>
            </View>
          )}
        </ScrollView>

        <FloatingActionButton
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        />
      </View>

      <Modal
        animationType="none"
        transparent
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
        statusBarTranslucent={true}
      >
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAddModal(false)}
          >
            <BlurView
              intensity={Platform.OS === "ios" ? 40 : 25}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <Animated.View
            entering={SlideInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                paddingBottom: Math.max(20, insets.bottom + 10),
                maxHeight: keyboardAdjustedModalMaxHeight,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View
                style={[styles.handleBar, { backgroundColor: colors.border }]}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingScheduledTask ? "Edit reminder" : "New reminder"}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Alert for{" "}
                {editingScheduledTask ? editingScheduledTask.date : selectedDay}
              </Text>

              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.textSoft }]}>
                  Reminder Title
                </Text>
                <TextInput
                  autoFocus
                  onChangeText={setTitle}
                  placeholder="e.g., Dentist Appointment"
                  placeholderTextColor="#64748B"
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={title}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.textSoft }]}>
                  Notes
                </Text>
                <TextInput
                  multiline
                  onChangeText={setDescription}
                  placeholder="Optional details"
                  placeholderTextColor="#64748B"
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  textAlignVertical="top"
                  value={description}
                />
              </View>

              <View style={styles.formField}>
                <Pressable
                  onPress={() => {
                    setUseTime(!useTime);
                  }}
                  style={styles.labelRow}
                >
                  <Text style={[styles.label, { color: colors.textSoft }]}>
                    Remind me at
                  </Text>
                  <View
                    style={[
                      styles.toggleBtn,
                      {
                        backgroundColor: useTime
                          ? colors.accent
                          : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: useTime ? "#FFF" : colors.textMuted },
                      ]}
                    >
                      {useTime ? "ON" : "OFF"}
                    </Text>
                  </View>
                </Pressable>

                {useTime && (
                  <View style={styles.timePickerContainer}>
                    <View style={styles.pickerRow}>
                      {/* Hours column */}
                      <View style={styles.pickerCol}>
                        <Text
                          style={[
                            styles.pickerColLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          Hour
                        </Text>
                        <ScrollView
                          ref={hourScrollRef}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={ITEM_HEIGHT}
                          decelerationRate="fast"
                          disableIntervalMomentum={true}
                          style={styles.colScroll}
                          onMomentumScrollEnd={(e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            const index = Math.round(y / ITEM_HEIGHT);
                            const realIndex = index % 12;
                            setSelectedHour(HOURS[realIndex]);

                            // Invisible loop reset
                            if (index < 12 || index >= 24) {
                              hourScrollRef.current?.scrollTo({
                                y: (realIndex + 12) * ITEM_HEIGHT,
                                animated: false,
                              });
                            }
                          }}
                        >
                          {INFINITE_HOURS.map((h, i) => (
                            <Pressable
                              key={i}
                              onPress={() => {
                                setSelectedHour(h);
                                // Calculate middle-set index for focus
                                hourScrollRef.current?.scrollTo({
                                  y: ((i % 12) + 12) * ITEM_HEIGHT,
                                  animated: true,
                                });
                              }}
                              style={[
                                styles.pickerItem,
                                {
                                  backgroundColor:
                                    selectedHour === h
                                      ? colors.accent
                                      : "transparent",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pickerItemText,
                                  {
                                    color:
                                      selectedHour === h ? "#FFF" : colors.text,
                                  },
                                ]}
                              >
                                {h}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Minutes column */}
                      <View style={styles.pickerCol}>
                        <Text
                          style={[
                            styles.pickerColLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          Min
                        </Text>
                        <ScrollView
                          ref={minScrollRef}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={ITEM_HEIGHT}
                          decelerationRate={0.985}
                          disableIntervalMomentum={false}
                          style={styles.colScroll}
                          onMomentumScrollEnd={(e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            const index = Math.round(y / ITEM_HEIGHT);
                            const realIndex = index % 60;
                            const val = MINUTES[realIndex];
                            setSelectedMinute(val);

                            // Invisible loop reset
                            if (index < 60 || index >= 120) {
                              minScrollRef.current?.scrollTo({
                                y: (realIndex + 60) * ITEM_HEIGHT,
                                animated: false,
                              });
                            }
                          }}
                          // Improve snap reliability
                          scrollEventThrottle={16}
                          snapToAlignment="start"
                          nestedScrollEnabled={true}
                        >
                          {INFINITE_MINUTES.map((m, i) => {
                            return (
                              <Pressable
                                key={i}
                                onPress={() => {
                                  setSelectedMinute(m);
                                  minScrollRef.current?.scrollTo({
                                    y: ((i % 60) + 60) * ITEM_HEIGHT,
                                    animated: true,
                                  });
                                }}
                                style={[
                                  styles.pickerItem,
                                  {
                                    backgroundColor:
                                      selectedMinute === m
                                        ? colors.accent
                                        : "transparent",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.pickerItemText,
                                    {
                                      color:
                                        selectedMinute === m
                                          ? "#FFF"
                                          : colors.text,
                                    },
                                  ]}
                                >
                                  {m.toString().padStart(2, "0")}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* AM/PM column */}
                      <View style={styles.pickerCol}>
                        <Text
                          style={[
                            styles.pickerColLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          AM/PM
                        </Text>
                        <ScrollView
                          ref={periodScrollRef}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={ITEM_HEIGHT}
                          decelerationRate={0.85}
                          disableIntervalMomentum={true}
                          style={styles.colScroll}
                          onMomentumScrollEnd={(e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            const index = Math.round(y / ITEM_HEIGHT);
                            const realIndex = index % 2;
                            const val = PERIODS[realIndex];
                            setPeriod(val);

                            // Invisible loop reset
                            if (index < 2 || index >= 4) {
                              periodScrollRef.current?.scrollTo({
                                y: (realIndex + 2) * ITEM_HEIGHT,
                                animated: false,
                              });
                            }
                          }}
                        >
                          {INFINITE_PERIODS.map((p, i) => (
                            <Pressable
                              key={i}
                              onPress={() => {
                                setPeriod(p);
                                periodScrollRef.current?.scrollTo({
                                  y: ((i % 2) + 2) * ITEM_HEIGHT,
                                  animated: true,
                                });
                              }}
                              style={[
                                styles.pickerItem,
                                {
                                  backgroundColor:
                                    period === p
                                      ? colors.accent
                                      : "transparent",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pickerItemText,
                                  {
                                    color: period === p ? "#FFF" : colors.text,
                                  },
                                ]}
                              >
                                {p}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.textSoft },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  disabled={!title.trim()}
                  onPress={handleSaveTask}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.accent },
                    !title.trim() && styles.primaryButtonDisabled,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {editingScheduledTask ? "Update" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 8 },
  calendarLayer: { width: "100%" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  headerIcon: {
    padding: 6,
  },
  monthTitle: {
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 18,
    textAlign: "center",
  },
  headerSide: {
    alignItems: "center",
    flexDirection: "row",
    width: 100, // Balanced width for both sides
  },
  headerSideRight: {
    justifyContent: "flex-end",
  },
  modePill: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginRight: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  modeText: {
    fontFamily: AppFonts.semibold,
    fontSize: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 4,
  },
  weekday: {
    fontFamily: AppFonts.semibold,
    fontSize: 12,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
  },
  dayCell: {
    alignItems: "center",
    borderRadius: 8,
    position: "relative",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayNumber: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
    textAlign: "center",
  },
  dayDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
    position: "absolute",
    bottom: 4,
  },
  dayDotHalo: {
    borderRadius: 999,
    height: 12,
    width: 12,
    position: "absolute",
    bottom: 1,
  },
  currentDayFill: {
    position: "absolute",
    inset: 0,
    borderRadius: 8,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionCount: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
    marginLeft: "auto",
  },
  allTasksButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  allTasksLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
  },
  body: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  todoCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  todoHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 6,
  },
  todoTitle: {
    flex: 1,
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
  todoDescription: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  todoActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    minWidth: 54,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    minWidth: 54,
  },
  emptyBlock: {
    alignItems: "center",
    paddingTop: 48,
  },
  emptyIconWrap: {
    alignItems: "center",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    marginBottom: 20,
    width: 80,
  },
  emptyTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: AppFonts.medium,
    fontSize: 15,
    textAlign: "center",
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalWrapper: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 32,
    borderWidth: 1,
    elevation: 5,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalScrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 12,
  },
  handleBar: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    marginBottom: 8,
    width: 40,
  },
  modalTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: AppFonts.medium,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  formField: {
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
  },
  modalInput: {
    borderRadius: 18,
    borderWidth: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toggleBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  toggleText: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  timePickerContainer: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  pickerCol: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  pickerColLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  colScroll: {
    backgroundColor: "#00000018",
    borderRadius: 12,
    height: 48, // Matches ITEM_HEIGHT exactly
    width: "100%",
  },
  pickerItem: {
    alignItems: "center",
    borderRadius: 12,
    height: 48, // Matches ITEM_HEIGHT exactly
    justifyContent: "center",
  },
  pickerItemText: {
    fontFamily: AppFonts.bold,
    fontSize: 20, // Larger font since only one is shown
  },
  modalActions: {
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 16,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    height: 56,
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFF",
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    height: 56,
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  skipButton: {
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    minWidth: 54,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  skipText: {
    fontFamily: AppFonts.bold,
    fontSize: 10,
    textAlign: "center",
  },
});
