import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ShoppingItem } from '@/types/task';
import { formatItemDate } from '@/utils/date';

type ShoppingItemProps = {
  item: ShoppingItem;
  category?: {
    color: string;
    name: string;
  };
  timeFormat: '12h' | '24h';
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onNotAvailable?: (id: string) => void;
  onEdit?: (item: ShoppingItem) => void;
  onLongPress?: () => void;
};

function ShoppingItemComponent({ item, category, timeFormat, onToggle, onDelete, onNotAvailable, onEdit, onLongPress }: ShoppingItemProps) {
  const colors = useAppTheme();
  const done = item.status === 'done';
  const notAvailable = item.status === 'not-available';

  return (
    <Pressable 
      onLongPress={onLongPress} 
      onPress={() => onEdit?.(item)}
      delayLongPress={250} 
      style={({ pressed }) => [
        styles.card, 
        { 
          backgroundColor: colors.surfaceElevated, 
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1
        }
      ]}
    > 
      <View style={styles.leftInteraction}>
        <Pressable 
          hitSlop={12}
          onPress={() => onToggle(item.id)} 
          style={[
            styles.checkbox, 
            { 
              borderColor: done ? colors.accent : colors.border, 
              backgroundColor: done ? colors.accent : colors.surfaceMuted 
            }
          ]}
        >
          {done ? <Ionicons name="checkmark" size={14} color={colors.isLight ? "#0F172A" : "#FFFFFF"} /> : null}
        </Pressable>
        
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text, flex: 1 }, done && { color: colors.textSoft, textDecorationLine: 'line-through' }]}>
              {item.title}
            </Text>
            {item.price !== undefined && item.price !== null && (
              <Text style={[styles.price, { color: colors.accent, opacity: done ? 0.6 : 1 }]}>
                ${item.price.toFixed(2)}
              </Text>
            )}
          </View>
          <View style={styles.metaWrap}>
            {category ? (
              <View style={[styles.badge, { backgroundColor: `${category.color}15`, borderColor: `${category.color}30` }]}>
                <View style={[styles.badgeDot, { backgroundColor: category.color }]} />
                <Text style={[styles.badgeText, { color: colors.isLight ? '#0F172A' : category.color }]}>{category.name}</Text>
              </View>
            ) : null}
            <View style={styles.createdRow}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {formatItemDate(item.createdAt, timeFormat)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.rightColumn}>
        <Pressable 
          onPress={() => onDelete(item.id)} 
          style={[styles.deleteButton, { backgroundColor: `${colors.danger}12` }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
        {!done && (
          <Pressable 
            onPress={() => onNotAvailable?.(item.id)}
            style={({ pressed }) => [
              styles.skipButton, 
              { 
                backgroundColor: notAvailable ? `${colors.accent}15` : colors.surfaceMuted,
                borderColor: notAvailable ? colors.accent : colors.border,
                opacity: pressed ? 0.6 : 1
              }
            ]}
          >
            <Text style={[styles.skipText, { color: notAvailable ? colors.accent : colors.textSoft }]}>
              {notAvailable ? 'RESTORE' : 'N/A'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export const ShoppingItemCard = memo(ShoppingItemComponent, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.status === next.item.status &&
    prev.item.title === next.item.title &&
    prev.item.description === next.item.description &&
    prev.item.categoryId === next.item.categoryId &&
    prev.item.price === next.item.price &&
    prev.timeFormat === next.timeFormat &&
    prev.category?.color === next.category?.color &&
    prev.category?.name === next.category?.name
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftInteraction: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontFamily: AppFonts.semibold,
    fontSize: 17,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  price: {
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  metaWrap: {
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  badgeText: {
    fontFamily: AppFonts.semibold,
    fontSize: 12,
  },
  createdRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  timestamp: {
    fontFamily: AppFonts.medium,
    fontSize: 12,
    marginLeft: 4,
  },
  rightColumn: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginLeft: 8,
  },
  skipButton: {
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 10,
  },
  skipText: {
    fontFamily: AppFonts.bold,
    fontSize: 10,
    textAlign: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    minWidth: 72,
  },
});
