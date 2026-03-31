import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsOptionSheet } from "@/components/settings-option-sheet";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useShoppingStore } from "@/store/use-task-store";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BDT_RATE = 120;

const StatBox = memo(({ colors, icon, label, value, tint }: any) => (
  <View style={[styles.statBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
    <View style={[styles.statIconWrap, { backgroundColor: `${tint}22` }]}>
      <Ionicons name={icon} size={20} color={tint} />
    </View>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSoft }]}>{label}</Text>
  </View>
));

export default function StatisticsScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const accent = colors.accent;
  const { categories, tasks, taskHistory, settings, updateSettings } = useShoppingStore();
  const firstDayOfWeek = settings.firstDayOfWeek || "monday";
  const currency = settings.currency || "USD";

  const [drilledCategoryId, setDrilledCategoryId] = useState<string | null>(null);
  const [isSelectionVisible, setIsSelectionVisible] = useState(false);

  const symbol = currency === "USD" ? "$" : "৳";
  const formatPrice = (val: number) => {
    const converted = currency === "USD" ? val : val * BDT_RATE;
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyHistory = useMemo(() => {
    return taskHistory.filter((h: any) => {
      const d = new Date(h.completedAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [taskHistory, currentMonth, currentYear]);

  const monthlyItems = useMemo(() => {
    return tasks.filter((item: any) => {
      const d = new Date(item.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [tasks, currentMonth, currentYear]);

  const totalPurchasedMonth = monthlyHistory.length;
  const totalPurchasedAllTime = taskHistory.length;
  const todayStr = now.toISOString().split('T')[0];
  const todaySpending = monthlyHistory.filter((h: any) => h.date === todayStr).reduce((sum: number, h: any) => sum + (h.price || 0), 0);
  const monthSpending = monthlyHistory.reduce((sum: number, h: any) => sum + (h.price || 0), 0);
  const totalSpendingAllTime = taskHistory.reduce((sum: number, h: any) => sum + (h.price || 0), 0);

  const streak = useMemo(() => {
    // Get unique dates where items were marked as purchased
    const activeDates = Array.from(new Set(taskHistory.map((h: any) => h.date))).sort();
    if (activeDates.length === 0) return { current: 0, longest: 0 };

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if the streak is still active (today or yesterday)
    let current = 0;
    const isStreakActive = activeDates.includes(todayStr) || activeDates.includes(yesterdayStr);

    if (isStreakActive) {
      let checkDate = activeDates.includes(todayStr) ? new Date() : yesterday;
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (activeDates.includes(checkStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate Best Streak
    let longest = 0;
    let temp = 0;
    for (let i = 0; i < activeDates.length; i++) {
      if (i > 0) {
        const prev = new Date(activeDates[i-1]);
        const curr = new Date(activeDates[i]);
        const diff = Math.floor((curr.getTime() - prev.getTime()) / 86400000);
        if (diff === 1) {
          temp++;
        } else {
          longest = Math.max(longest, temp);
          temp = 1;
        }
      } else {
        temp = 1;
      }
    }
    longest = Math.max(longest, temp);

    return { current, longest };
  }, [taskHistory]);

  const categorySpending = useMemo(() => {
    const data: Record<string, { id: string, name: string, color: string, amount: number }> = {};
    monthlyHistory.forEach((h: any) => {
      const catId = h.categoryId || "others";
      if (!data[catId]) {
        const cat = categories.find(c => c.id === catId);
        data[catId] = { id: catId, name: cat?.name || "Others", color: cat?.color || colors.textMuted, amount: 0 };
      }
      data[catId].amount += (h.price || 0);
    });
    return Object.values(data).sort((a, b) => b.amount - a.amount);
  }, [monthlyHistory, categories, colors.textMuted]);

  const maxSpendingInCat = Math.max(...categorySpending.map(c => c.amount), 1);

  const weekSpendingData = useMemo(() => {
    const data = [];
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const firstDayIndex = dayNames.indexOf(settings.firstDayOfWeek || "monday");
    const diff = (now.getDay() - firstDayIndex + 7) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const amount = taskHistory.filter((h: any) => h.date === dateStr).reduce((sum: number, h: any) => sum + (h.price || 0), 0);
      data.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), amount, day: d.getDate() });
    }
    return data;
  }, [taskHistory, settings.firstDayOfWeek]);

  const maxWeekSpending = Math.max(...weekSpendingData.map(d => d.amount), 1);
  const weekTotalSpending = weekSpendingData.reduce((sum, d) => sum + d.amount, 0);

  const drilldownItems = useMemo(() => {
    if (!drilledCategoryId) return [];
    return monthlyHistory.filter((h: any) => (h.categoryId || "others") === drilledCategoryId);
  }, [monthlyHistory, drilledCategoryId]);

  const drilledCategory = drilledCategoryId ? (categories.find(c => c.id === drilledCategoryId) || (drilledCategoryId === "others" ? { name: "Others", color: colors.textMuted } : null)) : null;
  const drilledTotal = drilldownItems.reduce((sum: number, h: any) => sum + (h.price || 0), 0);

  const toggleDrilldown = (catId: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDrilledCategoryId(catId);
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        {/* Header with Currency Selector */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
          <View style={[styles.currencySelector, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Pressable onPress={() => updateSettings({ currency: "USD" })} style={[styles.currencyBtn, currency === "USD" && { backgroundColor: accent }]}>
              <Text style={[styles.currencyText, { color: currency === "USD" ? "#FFF" : colors.textSoft }]}>$</Text>
            </Pressable>
            <Pressable onPress={() => updateSettings({ currency: "BDT" })} style={[styles.currencyBtn, currency === "BDT" && { backgroundColor: accent }]}>
              <Text style={[styles.currencyText, { color: currency === "BDT" ? "#FFF" : colors.textSoft }]}>৳</Text>
            </Pressable>
          </View>
        </View>

        {/* Dynamic Category card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWithBack}>
              {drilledCategoryId && (
                <Pressable onPress={() => toggleDrilldown(null)} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={20} color={accent} />
                </Pressable>
              )}
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {drilledCategoryId ? drilledCategory?.name : "Category Spending"}
              </Text>
            </View>
            {!drilledCategoryId && (
              <Pressable 
                onPress={() => setIsSelectionVisible(true)} 
                style={[styles.drilldownHeaderBtn, { backgroundColor: `${accent}15` }]}
              >
                <Ionicons name="options-outline" size={16} color={accent} />
                <Text style={[styles.drilldownHeaderBtnText, { color: accent }]}>Select</Text>
              </Pressable>
            )}
          </View>

          {!drilledCategoryId && (
            <Text style={[styles.cardSubtitle, { color: colors.textSoft, marginBottom: 16, marginTop: -12 }]}>
              Select a category to view details
            </Text>
          )}
          
          <View style={styles.cardContent}>
            {!drilledCategoryId ? (
              <View style={styles.categoryGraphArea}>
                {categorySpending.filter(c => c.id !== "others").length > 0 ? (
                  categorySpending.filter(c => c.id !== "others").map((cat, idx) => (
                    <View key={idx} style={styles.spendingRow}>
                      <View style={styles.spendingInfo}>
                        <View style={styles.catLabelRow}>
                          <View style={[styles.dot, { backgroundColor: cat.color }]} />
                          <Text style={[styles.catLabelText, { color: colors.text }]}>{cat.name}</Text>
                        </View>
                        <Text style={[styles.catAmountText, { color: colors.text }]}>{formatPrice(cat.amount)}</Text>
                      </View>
                      <View style={[styles.spendingBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                        <View style={[styles.spendingBarFill, { backgroundColor: cat.color, width: `${(cat.amount / maxSpendingInCat) * 100}%` }]} />
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyGraph}>
                    <Ionicons name="stats-chart-outline" size={32} color={colors.textMuted} />
                    <Text style={{ color: colors.textSoft, marginTop: 8 }}>No categories recorded</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.drillView}>
                {drilldownItems.length > 0 ? drilldownItems.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.drillItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.drillItemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.drillItemPrice, { color: colors.text }]}>{formatPrice(item.price || 0)}</Text>
                  </View>
                )) : (
                  <View style={styles.emptyDrill}>
                    <Text style={{ color: colors.textSoft }}>No items this month</Text>
                  </View>
                )}
                <View style={[styles.drillFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.footerPrice, { color: colors.text }]}>{formatPrice(drilledTotal)} Total</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Week View */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Spending this Week</Text>
          <View style={styles.weekChartArea}>
            {weekSpendingData.map((day, idx) => (
              <View key={idx} style={styles.weekBarCol}>
                <View style={[styles.weekBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View style={[styles.weekBarFill, { backgroundColor: accent, height: day.amount > 0 ? `${Math.max(10, (day.amount / maxWeekSpending) * 100)}%` : 0 }]} />
                </View>
                <Text style={[styles.weekLabel, { color: colors.textMuted }]}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Sections */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Overview</Text>
          <View style={styles.statsGrid}>
            <StatBox colors={colors} icon="bag-check-outline" label="Purchased (Month)" tint={accent} value={`${totalPurchasedMonth}`} />
            <StatBox colors={colors} icon="stats-chart-outline" label="Purchased All Time" tint={accent} value={`${totalPurchasedAllTime}`} />
            <StatBox colors={colors} icon="flash-outline" label="Current Streak" tint="#F59E0B" value={`${streak.current} d`} />
            <StatBox colors={colors} icon="ribbon-outline" label="Best Streak" tint="#F59E0B" value={`${streak.longest} d`} />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Overview</Text>
          <View style={styles.statsGrid}>
            <StatBox colors={colors} icon="wallet-outline" label="Spent Today" tint="#10B981" value={formatPrice(todaySpending)} />
            <StatBox colors={colors} icon="calendar-outline" label="Spent this Week" tint="#10B981" value={formatPrice(weekTotalSpending)} />
            <StatBox colors={colors} icon="cash-outline" label="Spent this Month" tint="#10B981" value={formatPrice(monthSpending)} />
            <StatBox colors={colors} icon="stats-chart-outline" label="Spent All Time" tint="#10B981" value={formatPrice(totalSpendingAllTime)} />
          </View>
        </View>
      </ScrollView>

      <SettingsOptionSheet
        visible={isSelectionVisible}
        title="Select Category"
        iconName="grid-outline"
        options={[
          ...categories.map(c => ({ label: c.name, value: c.id, color: c.color }))
        ]}
        selectedValue={drilledCategoryId || undefined}
        onClose={() => setIsSelectionVisible(false)}
        onSelect={(val) => {
          setIsSelectionVisible(false);
          toggleDrilldown(val);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontFamily: AppFonts.bold, fontSize: 32 },
  currencySelector: { flexDirection: "row", padding: 4, borderRadius: 14, borderWidth: 1, gap: 4 },
  currencyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  currencyText: { fontFamily: AppFonts.bold, fontSize: 14 },
  
  card: { borderRadius: 28, borderWidth: 1, padding: 20, marginBottom: 16, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  titleWithBack: { flexDirection: "row", alignItems: "center", flex: 1, gap: 4 },
  backBtn: { padding: 4, marginLeft: -4 },
  cardTitle: { fontFamily: AppFonts.bold, fontSize: 18 },
  cardSubtitle: { fontFamily: AppFonts.medium, fontSize: 12 },
  drilldownHeaderBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    gap: 6
  },
  drilldownHeaderBtnText: { fontFamily: AppFonts.bold, fontSize: 13 },
  cardContent: { },
  
  categoryGraphArea: { gap: 16 },
  spendingRow: { gap: 8 },
  spendingInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catLabelText: { fontFamily: AppFonts.semibold, fontSize: 14 },
  catAmountText: { fontFamily: AppFonts.bold, fontSize: 14 },
  spendingBarTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  spendingBarFill: { height: "100%", borderRadius: 4 },
  emptyGraph: { height: 120, justifyContent: "center", alignItems: "center", gap: 8 },
  
  drillView: { gap: 0 },
  drillItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  drillItemTitle: { flex: 1, fontFamily: AppFonts.medium, fontSize: 15, marginRight: 12 },
  drillItemPrice: { fontFamily: AppFonts.bold, fontSize: 15 },
  emptyDrill: { height: 100, justifyContent: "center", alignItems: "center" },
  drillFooter: { paddingTop: 16, marginTop: 12, borderTopWidth: 1, alignItems: "flex-end" },
  footerPrice: { fontFamily: AppFonts.bold, fontSize: 20 },

  weekChartArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 140, paddingTop: 10 },
  weekBarCol: { alignItems: "center", flex: 1, gap: 8 },
  weekBarTrack: { width: 12, height: 100, borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  weekBarFill: { width: "100%", borderRadius: 6 },
  weekLabel: { fontFamily: AppFonts.bold, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  
  sectionWrap: { marginBottom: 20 },
  sectionTitle: { fontFamily: AppFonts.bold, fontSize: 24, marginBottom: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "48.4%", padding: 16, borderRadius: 24, borderWidth: 1, minHeight: 110, justifyContent: "center" },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontFamily: AppFonts.bold, fontSize: 20, marginBottom: 2 },
  statLabel: { fontFamily: AppFonts.medium, fontSize: 13 },
});
