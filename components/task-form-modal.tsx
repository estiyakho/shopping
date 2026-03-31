import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
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
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { Task } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";
import { CategoryOptionSheet } from "./category-option-sheet";

const MIN_FIELD_HEIGHT = 56;

type TaskFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (taskId: string) => void;
  onSaved?: (taskId: string) => void;
  initialTask?: Task;
  defaultCategoryId?: string;
};

export function TaskFormModal({
  visible,
  onClose,
  onCreated,
  onSaved,
  initialTask,
  defaultCategoryId,
}: TaskFormModalProps) {
  const isAndroid = Platform.OS === "android";
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const categories = useTaskStore((state) => state.categories);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(defaultCategoryId);
  const [descriptionHeight, setDescriptionHeight] = useState(MIN_FIELD_HEIGHT);
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const isEditing = Boolean(initialTask);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTask?.title ?? "");
    setDescription(initialTask?.description ?? "");
    setSelectedCategoryId(initialTask?.categoryId ?? defaultCategoryId);
    setDescriptionHeight(MIN_FIELD_HEIGHT);
  }, [initialTask, defaultCategoryId, visible]);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const trimmedTitle = title.trim();
  const baseModalMaxHeight = Math.max(
    320,
    windowHeight - insets.top - insets.bottom - 48,
  );
  const keyboardAdjustedModalMaxHeight = isKeyboardVisible
    ? Math.max(
        260,
        windowHeight - insets.top - insets.bottom - keyboardHeight - 80,
      )
    : baseModalMaxHeight;

  const handleSave = () => {
    if (!trimmedTitle) return;

    runListAnimation();
    const taskId = initialTask
      ? updateTask(initialTask.id, {
          title: trimmedTitle,
          description,
          categoryId: selectedCategoryId,
        })
      : addTask({
          title: trimmedTitle,
          description,
          categoryId: selectedCategoryId,
        });

    if (taskId) {
      if (initialTask) onSaved?.(taskId);
      else onCreated?.(taskId);
    }
    onClose();
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <BlurView
            intensity={25}
            tint="dark"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0, 0, 0, 0.4)" },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </BlurView>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            styles.modalWrapper,
            isAndroid && styles.modalWrapperCentered,
          ]}
        >
          <Animated.View
            entering={SlideInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.sheet,
              isAndroid && styles.sheetCentered,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                paddingBottom: Math.max(24, insets.bottom + 16),
                maxHeight: Math.min(
                  keyboardAdjustedModalMaxHeight,
                  isAndroid ? windowHeight * 0.86 : windowHeight * 0.88,
                ),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              <View
                style={[styles.handle, { backgroundColor: colors.border }]}
              />
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isEditing ? "Edit Task" : "New Task"}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  <Ionicons name="close" size={18} color={colors.textSoft} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.textSoft }]}>
                    Title
                  </Text>
                  <TextInput
                    autoFocus
                    onChangeText={setTitle}
                    placeholder="What needs to be done?"
                    placeholderTextColor="#64748B"
                    style={[
                      styles.input,
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
                    Description
                  </Text>
                  <TextInput
                    multiline
                    onChangeText={setDescription}
                    onContentSizeChange={(e) =>
                      setDescriptionHeight(
                        Math.max(
                          MIN_FIELD_HEIGHT,
                          Math.min(150, e.nativeEvent.contentSize.height),
                        ),
                      )
                    }
                    placeholder="Optional details"
                    placeholderTextColor="#64748B"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                        height: descriptionHeight,
                        paddingTop: 12,
                      },
                    ]}
                    textAlignVertical="top"
                    value={description}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.textSoft }]}>
                    Category
                  </Text>
                  <Pressable
                    onPress={() => setCategorySheetVisible(true)}
                    style={[
                      styles.pickerRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.pickerValue}>
                      {selectedCategory ? (
                        <View
                          style={[
                            styles.pickerDot,
                            { backgroundColor: selectedCategory.color },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.pickerDot,
                            {
                              backgroundColor: colors.surfaceMuted,
                              borderColor: colors.border,
                              borderWidth: 1,
                            },
                          ]}
                        />
                      )}
                      <Text style={[styles.pickerText, { color: colors.text }]}>
                        {selectedCategory?.name ?? "None"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.footer}>
                <Pressable
                  onPress={onClose}
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
                  disabled={!trimmedTitle}
                  onPress={handleSave}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.accent },
                    !trimmedTitle && styles.disabledButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.isLight ? "#0F172A" : "#F8FAFC" },
                    ]}
                  >
                    {isEditing ? "Update" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>

        <CategoryOptionSheet
          visible={categorySheetVisible}
          categories={categories}
          selectedValue={selectedCategoryId}
          onClose={() => setCategorySheetVisible(false)}
          onSelect={setSelectedCategoryId}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalWrapperCentered: {
    justifyContent: "center",
    paddingVertical: 24,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  sheetCentered: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
  },
  sheetScrollContent: {
    flexGrow: 1,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    marginBottom: 20,
    width: 36,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  form: {
    gap: 16,
  },
  formField: {
    width: "100%",
  },
  label: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    minHeight: MIN_FIELD_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: MIN_FIELD_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  pickerValue: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  pickerDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  pickerText: {
    fontFamily: AppFonts.medium,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingTop: 8,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#F8FAFC",
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
});
