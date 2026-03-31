import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useShoppingStore } from "@/store/use-task-store";
import { runListAnimation } from "@/utils/layout-animation";

const BDT_RATE = 120;

function StatBox({
  icon,
  label,
  value,
  tint,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View
      style={[
        styles.statBox,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons color={tint} name={icon} size={18} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const accent = colors.accent;
  
  const items = useShoppingStore((state) => state.tasks);
  const itemHistory = useShoppingStore((state) => state.taskHistory);
  const categories = useShoppingStore((state) => state.categories);
  const settings = useShoppingStore((state) => state.settings);
  const updateSettings = useShoppingStore((state) => state.updateSettings);
  const firstDayOfWeek = settings.firstDayOfWeek;
  const currency = settings.currency || "USD";

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const symbol = currency === "USD" ? "$" : "৳";
  const formatPrice = (val: number) => {
    const converted = currency === "USD" ? val : val * BDT_RATE;
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Filter history for current month
  const monthlyHistory = useMemo(() => {
    return itemHistory.filter(h => {
      const d = new Date(h.completedAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [itemHistory, currentMonth, currentYear]);

  // 2. Filter items created this month
  const monthlyItems = useMemo(() => {
    return items.filter(item => {
      const d = new Date(item.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [items, currentMonth, currentYear]);

  // 3. Totals
  const totalItemCount = monthlyItems.length;
  const purchasedCount = monthlyHistory.length;
  
  const todayStr = now.toISOString().split('T')[0];
  const todaySpending = monthlyHistory
    .filter(h => h.date === todayStr)
    .reduce((sum, h) => sum + (h.price || 0), 0);

  const monthSpending = monthlyHistory.reduce((sum, h) => sum + (h.price || 0), 0);

  // 4. Streak Logic: Consecutive days with spending
  const streak = useMemo(() => {
    const spentDates = new Set(itemHistory.map(h => h.date));
    const sortedDates = Array.from(spentDates).sort((a, b) => b.localeCompare(a));
    
    if (sortedDates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let temp = 0;

    // Check current streak from today or yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const hasToday = spentDates.has(today);
    const hasYesterday = spentDates.has(yesterday);

    if (hasToday || hasYesterday) {
      let checkDate = hasToday ? new Date() : new Date(Date.now() - 86400000);
      while (spentDates.has(checkDate.toISOString().split('T')[0])) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Longest streak
    const allSorted = Array.from(spentDates).sort((a, b) => a.localeCompare(b));
    let prevDate: Date | null = null;
    for (const d of allSorted) {
      const cur = new Date(d);
      if (prevDate) {
        const diff = Math.floor((cur.getTime() - prevDate.getTime()) / 86400000);
        if (diff === 1) {
          temp++;
        } else {
          longest = Math.max(longest, temp);
          temp = 1;
        }
      } else {
        temp = 1;
      }
      prevDate = cur;
    }
    longest = Math.max(longest, temp);

    return { current, longest };
  }, [itemHistory]);

  // 5. Category Spending Breakdown
  const categorySpending = useMemo(() => {
    const data: Record<string, { name: string, color: string, amount: number }> = {};
    
    monthlyHistory.forEach(h => {
      const catId = h.categoryId || "others";
      if (!data[catId]) {
        const cat = categories.find(c => c.id === catId);
        data[catId] = {
          name: cat?.name || "Others",
          color: cat?.color || colors.textMuted,
          amount: 0
        };
      }
      data[catId].amount += (h.price || 0);
    });

    return Object.values(data).sort((a, b) => b.amount - a.amount);
  }, [monthlyHistory, categories, colors.textMuted]);

  const filteredCategorySpending = useMemo(() => {
    if (selectedCategoryId === "all") return categorySpending;
    return categorySpending.filter(c => {
      const id = categories.find(cat => cat.name === c.name)?.id || "others";
      return id === selectedCategoryId;
    });
  }, [categorySpending, selectedCategoryId, categories]);

  const maxSpendingInCat = Math.max(...categorySpending.map(c => c.amount), 1);

  // 6. Week Spending View (Creation Date or Completion Date?) - Logic: Money spent per day this week
  const weekSpendingData = useMemo(() => {
    const data = [];
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
    const currentDayIndex = now.getDay();
    const daysToSubtract = (currentDayIndex - firstDayIndex + 7) % 7;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const amount = itemHistory
        .filter(h => h.date === dateStr)
        .reduce((sum, h) => sum + (h.price || 0), 0);
        
      data.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        amount,
        day: d.getDate()
      });
    }
    return data;
  }, [itemHistory, firstDayOfWeek]);

  const maxWeekSpending = Math.max(...weekSpendingData.map(d => d.amount), 1);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Currency Selector */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
          <View style={[styles.currencySelector, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Pressable 
              onPress={() => updateSettings({ currency: "USD" })}
              style={[styles.currencyBtn, currency === "USD" && { backgroundColor: accent }]}
            >
              <Text style={[styles.currencyText, { color: currency === "USD" ? "#FFF" : colors.textSoft }]}>$</Text>
            </Pressable>
            <Pressable 
              onPress={() => updateSettings({ currency: "BDT" })}
              style={[styles.currencyBtn, currency === "BDT" && { backgroundColor: accent }]}
            >
              <Text style={[styles.currencyText, { color: currency === "BDT" ? "#FFF" : colors.textSoft }]}>৳</Text>
            </Pressable>
          </View>
        </View>

        {/* Category Island Horizontal Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryIslandScroll}
          contentContainerStyle={styles.categoryIslandContent}
        >
          <Pressable 
            onPress={() => setSelectedCategoryId("all")}
            style={[styles.categoryChip, selectedCategoryId === "all" && { backgroundColor: colors.surfaceElevated, borderColor: accent }]}
          >
            <Text style={[styles.categoryChipText, { color: selectedCategoryId === "all" ? colors.text : colors.textSoft }]}>All</Text>
          </Pressable>
          {categories.map(cat => (
            <Pressable 
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={[styles.categoryChip, selectedCategoryId === cat.id && { backgroundColor: colors.surfaceElevated, borderColor: cat.color }]}
            >
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={[styles.categoryChipText, { color: selectedCategoryId === cat.id ? colors.text : colors.textSoft }]}>{cat.name}</Text>
            </Pressable>
          ))}
          <Pressable 
            onPress={() => setSelectedCategoryId("others")}
            style={[styles.categoryChip, selectedCategoryId === "others" && { backgroundColor: colors.surfaceElevated, borderColor: colors.textMuted }]}
          >
            <Text style={[styles.categoryChipText, { color: selectedCategoryId === "others" ? colors.text : colors.textSoft }]}>Others</Text>
          </Pressable>
        </ScrollView>

        {/* Category Spending Graph */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Category Spending</Text>
          <View style={styles.categoryGraphArea}>
            {filteredCategorySpending.length > 0 ? (
              filteredCategorySpending.map((cat, idx) => (
                <View key={idx} style={styles.spendingRow}>
                  <View style={styles.spendingInfo}>
                    <View style={styles.catLabelRow}>
                      <View style={[styles.dot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catLabelText, { color: colors.text }]}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.catAmountText, { color: colors.text }]}>{formatPrice(cat.amount)}</Text>
                  </View>
                  <View style={[styles.spendingBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                    <View 
                      style={[
                        styles.spendingBarFill, 
                        { backgroundColor: cat.color, width: `${(cat.amount / maxSpendingInCat) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyGraph}>
                <Ionicons name="stats-chart-outline" size={32} color={colors.textMuted} />
                <Text style={{ color: colors.textSoft, marginTop: 8 }}>No spending recorded</Text>
              </View>
            )}
          </View>
        </View>

        {/* Week View Spending Chart */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Spending this Week</Text>
          <View style={styles.weekChartArea}>
            {weekSpendingData.map((day, idx) => (
              <View key={idx} style={styles.weekBarCol}>
                <View style={[styles.weekBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View 
                    style={[
                      styles.weekBarFill, 
                      { 
                        backgroundColor: accent, 
                        height: day.amount > 0 ? `${Math.max(10, (day.amount / maxWeekSpending) * 100)}%` : 0 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.weekLabel, { color: colors.textMuted }]}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Item Overview */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Overview</Text>
          <View style={styles.statsGrid}>
            <StatBox colors={colors} icon="cart-outline" label="Created (Month)" tint={accent} value={`${totalItemCount}`} />
            <StatBox colors={colors} icon="bag-check-outline" label="Purchased (Month)" tint={accent} value={`${purchasedCount}`} />
            <StatBox colors={colors} icon="flash-outline" label="Current Streak" tint="#F59E0B" value={`${streak.current} d`} />
            <StatBox colors={colors} icon="ribbon-outline" label="Best Streak" tint="#F59E0B" value={`${streak.longest} d`} />
          </View>
        </View>

        {/* Spending Overview */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Overview</Text>
          <View style={styles.statsGrid}>
            <StatBox colors={colors} icon="wallet-outline" label="Spent Today" tint="#10B981" value={formatPrice(todaySpending)} />
            <StatBox colors={colors} icon="cash-outline" label="Spent (Month)" tint="#10B981" value={formatPrice(monthSpending)} />
            <StatBox colors={colors} icon="calculator-outline" label="Avg/Item" tint="#10B981" value={formatPrice(purchasedCount > 0 ? monthSpending / purchasedCount : 0)} />
            <StatBox colors={colors} icon="grid-outline" label="Top Category" tint="#10B981" value={categorySpending[0]?.name || "None"} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontFamily: AppFonts.bold, fontSize: 28 },
  currencySelector: { 
    flexDirection: "row", 
    padding: 4, 
    borderRadius: 14, 
    borderWidth: 1, 
    gap: 4 
  },
  currencyBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  currencyText: { fontFamily: AppFonts.bold, fontSize: 14 },
  
  categoryIslandScroll: { marginHorizontal: -16, marginBottom: 16 },
  categoryIslandContent: { paddingHorizontal: 16, gap: 10 },
  categoryChip: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "transparent",
    gap: 6
  },
  categoryChipText: { fontFamily: AppFonts.bold, fontSize: 13 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  
  card: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardTitle: { fontFamily: AppFonts.bold, fontSize: 18, marginBottom: 16 },
  
  categoryGraphArea: { gap: 16 },
  spendingRow: { gap: 8 },
  spendingInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catLabelText: { fontFamily: AppFonts.semibold, fontSize: 14 },
  catAmountText: { fontFamily: AppFonts.bold, fontSize: 14 },
  spendingBarTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  spendingBarFill: { height: "100%", borderRadius: 4 },
  emptyGraph: { height: 100, justifyContent: "center", alignItems: "center" },
  
  weekChartArea: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-end", 
    height: 140,
    paddingTop: 10
  },
  weekBarCol: { alignItems: "center", flex: 1, gap: 8 },
  weekBarTrack: { width: 12, height: 100, borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  weekBarFill: { width: "100%", borderRadius: 6 },
  weekLabel: { fontFamily: AppFonts.bold, fontSize: 10 },
  
  sectionWrap: { marginBottom: 20 },
  sectionTitle: { fontFamily: AppFonts.bold, fontSize: 22, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { 
    width: "48.4%", 
    padding: 14, 
    borderRadius: 20, 
    borderWidth: 1, 
    minHeight: 100,
    justifyContent: "center"
  },
  statIconWrap: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 8 
  },
  statValue: { fontFamily: AppFonts.bold, fontSize: 18, marginBottom: 2 },
  statLabel: { fontFamily: AppFonts.medium, fontSize: 12 },
});

