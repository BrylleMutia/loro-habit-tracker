import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";

import { colors } from "../constants/colors";
import { equipmentItemsById } from "../constants/equipment";
import { images } from "../constants/images";
import { loadoutSlots } from "../constants/profile";
import { shadows } from "../styles/shadows";
import type { EquipmentSlotId, InventoryItem } from "../types/app";

type EquipmentLoadoutGridProps = {
  equippedItemIds: readonly string[];
  inventoryItems: readonly InventoryItem[];
  title?: string;
  countLabel?: string;
  selectedSlotId?: EquipmentSlotId | "all";
  onSlotPress?: (slotId: EquipmentSlotId) => void;
};

function getItemLabel(item: InventoryItem | null) {
  return item?.name ?? "Empty";
}

function getItemColors(item: InventoryItem | null) {
  return {
    background: item ? colors.raritySoft[item.rarity] : colors.graySoft,
    border: item ? colors.rarity[item.rarity] : colors.line
  };
}

const EquipmentSlotTile = memo(function EquipmentSlotTile({
  item,
  selected,
  slot,
  onPress
}: {
  item: InventoryItem | null;
  selected: boolean;
  slot: (typeof loadoutSlots)[number];
  onPress?: () => void;
}) {
  const definition = item ? equipmentItemsById[item.itemDefinitionId] : null;
  const itemColors = getItemColors(item);
  const TileContainer = Pressable;
  const accessibilityLabel = onPress
    ? `Filter ${slot.label} equipment`
    : `${slot.label}: ${getItemLabel(item)}`;

  return (
    <TileContainer
      className="min-w-0 flex-1 rounded-card px-1 py-2"
      style={{
        backgroundColor: itemColors.background,
        borderColor: itemColors.border,
        borderWidth: selected ? 3 : 2,
        minHeight: 112
      }}
      accessibilityLabel={`${accessibilityLabel}${selected ? ", selected" : ""}`}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
    >
      <View className="relative h-16 w-full items-center justify-center">
        {definition ? (
          <Image
            source={definition.image}
            resizeMode="contain"
            className="h-16 w-16"
            accessibilityLabel={item?.name ?? slot.label}
          />
        ) : (
          <Image
            source={images.equipmentSlotPlaceholders[slot.id]}
            resizeMode="contain"
            className="h-[61px] w-[61px]"
            accessible={false}
          />
        )}
      </View>
      <Text className="mt-1 text-center text-micro font-black uppercase text-content" numberOfLines={1}>
        {slot.label}
      </Text>
      <Text className="mt-1 w-full text-center text-micro font-bold text-content-muted" numberOfLines={1}>
        {getItemLabel(item)}
      </Text>
    </TileContainer>
  );
});

export const EquipmentLoadoutGrid = memo(function EquipmentLoadoutGrid({
  countLabel,
  equippedItemIds,
  inventoryItems,
  onSlotPress,
  selectedSlotId,
  title
}: EquipmentLoadoutGridProps) {
  const inventoryById = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems]
  );
  const rows = [loadoutSlots.slice(0, 4), loadoutSlots.slice(4)];

  return (
    <View className="rounded-card border border-line bg-surface-card p-2" style={shadows.card}>
      {title ? (
        <View className="mb-2 flex-row items-center justify-between px-1">
          <View className="flex-row items-center">
            <View className="h-7 w-7 items-center justify-center rounded-pill bg-primary-soft">
              <Ionicons name="shirt-outline" size={16} color={colors.blueDark} />
            </View>
            <Text className="ml-2 text-sm font-black text-content">{title}</Text>
          </View>
          {countLabel ? <Text className="text-xs font-bold text-content-muted">{countLabel}</Text> : null}
        </View>
      ) : null}
      <View className="gap-1">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex === 0 ? "equipment-row-one" : "equipment-row-two"} className="flex-row gap-1">
            {row.map((slot) => (
              <EquipmentSlotTile
                key={slot.id}
                item={inventoryById.get(equippedItemIds[slot.sortOrder]) ?? null}
                onPress={onSlotPress ? () => onSlotPress(slot.id) : undefined}
                selected={selectedSlotId === slot.id}
                slot={slot}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
});
