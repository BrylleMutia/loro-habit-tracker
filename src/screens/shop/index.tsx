import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { EquipmentLoadoutGrid } from "../../components/EquipmentLoadoutGrid";
import { InventoryStackDetailsModal } from "../../components/InventoryStackDetailsModal";
import { INVENTORY_PAGE_SIZE, InventoryStashGrid } from "../../components/InventoryStashGrid";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { loadoutSlots } from "../../constants/profile";
import { useAppState } from "../../contexts/appContext";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
import type { EquipmentSlotId } from "../../types/app";
import {
  groupInventoryItems,
  type InventorySortDirection,
  type InventorySortKey
} from "../../utility/inventory";

type ShopScreenProps = {
  onDailyCheckInPress: () => void;
};

type SlotFilter = "all" | EquipmentSlotId;

const sortOptions: { id: InventorySortKey; label: string }[] = [
  { id: "rarity", label: "Rarity" },
  { id: "acquired", label: "Recent" },
  { id: "value", label: "Value" },
  { id: "set", label: "Set" }
];

export function ShopScreen({ onDailyCheckInPress }: ShopScreenProps) {
  const {
    equipItem,
    inventory,
    isOnline,
    mutationInFlight,
    profile,
    syncError
  } = useAppState();
  const contentWidth = useScreenContentWidth();
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [sortKey, setSortKey] = useState<InventorySortKey>("rarity");
  const [sortDirection, setSortDirection] = useState<InventorySortDirection>("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedStackKey, setSelectedStackKey] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const filteredItems = useMemo(
    () =>
      inventory.items.filter((item) => slotFilter === "all" || item.slotId === slotFilter),
    [inventory.items, slotFilter]
  );
  const groupedItems = useMemo(
    () => groupInventoryItems(filteredItems, profile.equippedItemIds, sortKey, sortDirection),
    [filteredItems, profile.equippedItemIds, sortDirection, sortKey]
  );
  const allGroupedItems = useMemo(
    () => groupInventoryItems(inventory.items, profile.equippedItemIds, sortKey, sortDirection),
    [inventory.items, profile.equippedItemIds, sortDirection, sortKey]
  );
  const pageCount = Math.max(1, Math.ceil(groupedItems.length / INVENTORY_PAGE_SIZE));
  const selectedStack = useMemo(
    () => allGroupedItems.find((stack) => stack.key === selectedStackKey) ?? null,
    [allGroupedItems, selectedStackKey]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [slotFilter, sortDirection, sortKey]);

  useEffect(() => {
    setPageIndex((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  useEffect(() => {
    if (selectedStackKey && !selectedStack) {
      setSelectedStackKey(null);
    }
  }, [selectedStack, selectedStackKey]);

  const handleEquip = async (itemId: string) => {
    setPendingItemId(itemId);
    try {
      await equipItem(itemId);
      return true;
    } catch {
      // The shared sync banner communicates remote or validation failures.
      return false;
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-28 pt-3"
      contentContainerStyle={{ width: "100%" }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ minHeight: 0 }}
    >
      <View className="self-center" style={{ width: contentWidth }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-display text-2xl font-black text-content">Shop</Text>
            <Text className="mt-1 text-xs font-bold text-content-muted">Gear found on your trail</Text>
          </View>
          <View className="flex-row items-center rounded-pill border border-line-reward bg-reward-soft px-3 py-2">
            <Ionicons name="ellipse" size={15} color={colors.gold} />
            <Text className="ml-1 text-sm font-black text-content">{inventory.items.length}</Text>
            <Text className="ml-1 text-xs font-bold text-content-muted">items</Text>
          </View>
        </View>

        <View className="mt-4">
          <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />
        </View>

        <View className="mt-4">
          <EquipmentLoadoutGrid
            countLabel={`${profile.equippedItemIds.filter(Boolean).length}/8 equipped`}
            equippedItemIds={profile.equippedItemIds}
            inventoryItems={inventory.items}
            onSlotPress={(slotId) =>
              setSlotFilter((current) => (current === slotId ? "all" : slotId))
            }
            selectedSlotId={slotFilter}
            title="Equipment loadout"
          />
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-sm font-black text-content">Inventory</Text>
          <Text className="text-xs font-bold text-content-muted">
            {groupedItems.length} {groupedItems.length === 1 ? "stack" : "stacks"}
          </Text>
        </View>

        <ScrollView
          className="mt-3"
          contentContainerClassName="gap-2"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <FilterChip
            active={slotFilter === "all"}
            icon="apps-outline"
            label="All"
            onPress={() => setSlotFilter("all")}
          />
          {loadoutSlots.map((slot) => (
            <FilterChip
              key={slot.id}
              active={slotFilter === slot.id}
              icon={slot.icon}
              label={slot.label}
              onPress={() => setSlotFilter(slot.id)}
            />
          ))}
        </ScrollView>

        <View className="mt-3 flex-row items-center">
          <Text className="mr-2 text-xs font-extrabold uppercase text-content-muted">Sort by</Text>
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-2"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                className={`rounded-pill border px-3 py-2 ${
                  sortKey === option.id
                    ? "border-primary bg-primary-soft"
                    : "border-line bg-surface-card"
                }`}
                activeOpacity={0.8}
                accessibilityLabel={`Sort equipment by ${option.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: sortKey === option.id }}
                onPress={() => setSortKey(option.id)}
              >
                <Text
                  className={`text-xs font-black ${
                    sortKey === option.id ? "text-primary-strong" : "text-content-muted"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            className="ml-2 h-9 w-9 items-center justify-center rounded-card border border-line bg-surface-card"
            activeOpacity={0.8}
            accessibilityLabel={`Sort ${sortDirection === "desc" ? "ascending" : "descending"}`}
            accessibilityRole="button"
            onPress={() => setSortDirection((direction) => (direction === "desc" ? "asc" : "desc"))}
          >
            <Ionicons
              name={sortDirection === "desc" ? "arrow-down" : "arrow-up"}
              size={17}
              color={colors.blueDark}
            />
          </TouchableOpacity>
        </View>

        {syncError && !isOnline ? (
          <Text className="mt-3 text-xs font-bold text-content-red">Inventory is showing cached gear.</Text>
        ) : null}

        {groupedItems.length > 0 ? (
          <InventoryStashGrid
            pageCount={pageCount}
            pageIndex={pageIndex}
            stacks={groupedItems}
            onItemPress={(stack) => setSelectedStackKey(stack.key)}
            onPageChange={(nextPage) =>
              setPageIndex(Math.min(Math.max(nextPage, 0), pageCount - 1))
            }
          />
        ) : (
          <View className="mt-3 items-center rounded-card border border-line bg-surface-card px-6 py-10" style={shadows.card}>
            <View className="h-14 w-14 items-center justify-center rounded-card bg-primary-soft">
              <Ionicons name="briefcase-outline" size={27} color={colors.blueDark} />
            </View>
            <Text className="mt-4 text-lg font-black text-content">Your pack is empty</Text>
            <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
              Complete a daily quest to discover your first piece of trail gear.
            </Text>
          </View>
        )}

        <InventoryStackDetailsModal
          loading={mutationInFlight === "equipment" && pendingItemId !== null}
          onClose={() => setSelectedStackKey(null)}
          onEquip={handleEquip}
          stack={selectedStack}
        />
      </View>
    </ScrollView>
  );
}

function FilterChip({
  active,
  icon,
  label,
  onPress
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center rounded-pill border px-3 py-2 ${
        active ? "border-primary bg-primary-soft" : "border-line bg-surface-card"
      }`}
      activeOpacity={0.8}
      accessibilityLabel={`Filter equipment by ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={14} color={active ? colors.blueDark : colors.grayIcon} />
      <Text
        className={`ml-1 text-xs font-black ${
          active ? "text-primary-strong" : "text-content-muted"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
