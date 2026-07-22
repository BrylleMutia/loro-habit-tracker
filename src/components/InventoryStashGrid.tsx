import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { equipmentItemsById } from "../constants/equipment";
import { shadows } from "../styles/shadows";
import type { InventoryStack } from "../types/app";

export const INVENTORY_PAGE_SIZE = 8;
const INVENTORY_GRID_GAP = 4;

type InventoryStashGridProps = {
  pageCount: number;
  pageIndex: number;
  stacks: readonly InventoryStack[];
  onItemPress: (stack: InventoryStack) => void;
  onPageChange: (pageIndex: number) => void;
};

function InventoryStackCell({
  onPress,
  stack
}: {
  onPress: () => void;
  stack: InventoryStack;
}) {
  const definition = equipmentItemsById[stack.representative.itemDefinitionId];

  return (
    <Pressable
      className="relative min-w-0 flex-1 rounded-card border-2 p-1"
      style={{
        alignItems: "center",
        aspectRatio: 1,
        backgroundColor: colors.raritySoft[stack.representative.rarity],
        borderColor: colors.rarity[stack.representative.rarity],
        justifyContent: "center"
      }}
      accessibilityLabel={`${stack.representative.name}, ${stack.quantity} owned, ${stack.totalValue} total value${stack.isEquipped ? ", equipped" : ""}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      {definition ? (
        <Image
          source={definition.image}
          resizeMode="contain"
          style={{ width: "76%", height: "76%" }}
          accessibilityLabel={stack.representative.name}
        />
      ) : (
        <Ionicons name="cube-outline" size={30} color={colors.grayIcon} />
      )}

      {stack.isEquipped ? (
        <View
          className="absolute right-1 top-1 items-center justify-center"
          style={{ zIndex: 2 }}
        >
          <Ionicons name="checkmark-circle" size={19} color={colors.blueDark} />
        </View>
      ) : null}

      <View className="absolute bottom-1 left-1 flex-row items-center rounded-pill border border-line-reward bg-reward-soft px-1.5 py-0.5">
        <Ionicons name="ellipse" size={10} color={colors.gold} />
        <Text className="ml-0.5 text-micro font-black text-content">{stack.totalValue}</Text>
      </View>
      <View className="absolute bottom-1 right-1 rounded-pill bg-surface-card px-1.5 py-0.5">
        <Text className="text-micro font-black text-content">x{stack.quantity}</Text>
      </View>
    </Pressable>
  );
}

function PageButton({
  disabled,
  icon,
  label,
  onPress
}: {
  disabled: boolean;
  icon: "chevron-back" | "chevron-forward";
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`h-9 w-9 items-center justify-center rounded-pill border border-line bg-surface-card ${disabled ? "opacity-40" : ""}`}
      activeOpacity={0.82}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={colors.blueDark} />
    </TouchableOpacity>
  );
}

export function InventoryStashGrid({
  pageCount,
  pageIndex,
  stacks,
  onItemPress,
  onPageChange
}: InventoryStashGridProps) {
  const pageItems = stacks.slice(
    pageIndex * INVENTORY_PAGE_SIZE,
    (pageIndex + 1) * INVENTORY_PAGE_SIZE
  );
  const cells = Array.from({ length: INVENTORY_PAGE_SIZE }, (_, index) => pageItems[index] ?? null);

  return (
    <View className="mt-3 rounded-card border border-line bg-surface-card p-2" style={shadows.card}>
      <View style={{ rowGap: INVENTORY_GRID_GAP }}>
        {[cells.slice(0, 4), cells.slice(4)].map((row, rowIndex) => (
          <View
            key={rowIndex === 0 ? "stash-row-one" : "stash-row-two"}
            className="flex-row"
            style={{ columnGap: INVENTORY_GRID_GAP }}
          >
            {row.map((stack, cellIndex) =>
              stack ? (
                <InventoryStackCell
                  key={stack.key}
                  onPress={() => onItemPress(stack)}
                  stack={stack}
                />
              ) : (
                <View
                  key={`stash-empty-${rowIndex}-${cellIndex}`}
                  className="min-w-0 flex-1 rounded-card border-2 p-1"
                  style={{
                    aspectRatio: 1,
                    backgroundColor: colors.graySoft,
                    borderColor: colors.line
                  }}
                />
              )
            )}
          </View>
        ))}
      </View>

      <View className="mt-2 flex-row items-center justify-between px-1">
        <PageButton
          disabled={pageIndex === 0}
          icon="chevron-back"
          label="Previous inventory page"
          onPress={() => onPageChange(pageIndex - 1)}
        />
        <Text className="text-xs font-black text-content-muted">
          Page {pageIndex + 1} of {Math.max(pageCount, 1)}
        </Text>
        <PageButton
          disabled={pageIndex >= pageCount - 1}
          icon="chevron-forward"
          label="Next inventory page"
          onPress={() => onPageChange(pageIndex + 1)}
        />
      </View>
    </View>
  );
}
