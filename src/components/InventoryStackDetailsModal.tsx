import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../constants/colors";
import {
  equipmentItemsById,
  equipmentRaritiesById
} from "../constants/equipment";
import { equipmentAttributes, loadoutSlots } from "../constants/profile";
import { shadows } from "../styles/shadows";
import type { InventoryStack } from "../types/app";
import { QuestActionButton } from "./QuestActionButton";

function formatFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getSlotLabel(slotId: InventoryStack["representative"]["slotId"]) {
  return loadoutSlots.find((slot) => slot.id === slotId)?.label ?? "Gear";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-line-subtle py-2">
      <Text className="text-xs font-bold text-content-muted">{label}</Text>
      <Text className="ml-3 flex-1 text-right text-xs font-black text-content" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function InventoryStackDetailsModal({
  loading,
  onClose,
  onEquip,
  stack
}: {
  loading: boolean;
  onClose: () => void;
  onEquip: (itemId: string) => Promise<boolean>;
  stack: InventoryStack | null;
}) {
  if (!stack) return null;

  const definition = equipmentItemsById[stack.representative.itemDefinitionId];
  const rarity = equipmentRaritiesById[stack.representative.rarity];
  const actionItemId = stack.equippedItemId ?? stack.representative.id;

  const handleEquip = async () => {
    const succeeded = await onEquip(actionItemId);
    if (succeeded) onClose();
  };

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable
          className="absolute inset-0"
          accessibilityLabel="Close item details"
          accessibilityRole="button"
          onPress={onClose}
        />
        <SafeAreaView
          edges={["bottom"]}
          className="rounded-card border border-line bg-surface-card px-4 pt-4"
          style={[shadows.card, { maxHeight: "88%" }]}
          accessibilityViewIsModal
        >
          <View className="flex-row items-start justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="font-display text-xl font-black text-content" numberOfLines={2}>
                {stack.representative.name}
              </Text>
              <View
                className="mt-2 self-start rounded-pill px-2 py-1"
                style={{ backgroundColor: colors.raritySoft[stack.representative.rarity] }}
              >
                <Text className="text-micro font-black" style={{ color: colors.rarity[stack.representative.rarity] }}>
                  {rarity.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-pill bg-surface-muted"
              activeOpacity={0.82}
              accessibilityLabel="Close item details"
              accessibilityRole="button"
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="mt-4"
            contentContainerClassName="pb-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center rounded-card border p-3" style={{ backgroundColor: colors.raritySoft[stack.representative.rarity], borderColor: colors.rarity[stack.representative.rarity] }}>
              <View className="h-24 w-24 items-center justify-center rounded-card border bg-surface-card" style={{ borderColor: colors.rarity[stack.representative.rarity] }}>
                {definition ? (
                  <Image
                    source={definition.image}
                    resizeMode="contain"
                    className="h-20 w-20"
                    accessibilityLabel={stack.representative.name}
                  />
                ) : (
                  <Ionicons name="cube-outline" size={34} color={colors.grayIcon} />
                )}
              </View>
              <View className="ml-3 min-w-0 flex-1">
                <Text className="text-xs font-black text-content">{stack.representative.setName}</Text>
                <Text className="mt-2 text-micro font-extrabold uppercase text-content-muted">
                  {stack.isEquipped ? "Currently equipped" : "Not equipped"}
                </Text>
                <View className="mt-2 self-start rounded-pill bg-reward-soft px-2 py-1">
                  <Text className="text-micro font-black text-content-gold">{stack.totalValue} total value</Text>
                </View>
              </View>
            </View>

            <View className="mt-3 rounded-card border border-line bg-surface-card px-3">
              <DetailRow label="Slot" value={getSlotLabel(stack.representative.slotId)} />
              <DetailRow label="Set" value={stack.representative.setName} />
              <DetailRow label="Owned" value={`x${stack.quantity}`} />
              <DetailRow label="First acquired" value={formatFullDate(stack.firstAcquiredAt)} />
            </View>

            <View className="mt-3 rounded-card border border-line bg-surface-card p-3">
              <Text className="text-xs font-black uppercase text-content-muted">Stats</Text>
              <View className="mt-2 flex-row flex-wrap gap-1">
                {Object.entries(stack.representative.stats).map(([attributeId, amount]) => {
                  const attribute = equipmentAttributes.find((candidate) => candidate.id === attributeId);
                  return (
                    <View key={attributeId} className="flex-row items-center rounded-pill bg-primary-soft px-2 py-1">
                      <Ionicons name={attribute?.icon ?? "sparkles-outline"} size={13} color={colors.blueDark} />
                      <Text className="ml-1 text-micro font-extrabold text-primary-strong">
                        +{amount} {attribute?.label ?? attributeId}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="mt-4">
              <QuestActionButton
                accessibilityLabel={`${stack.isEquipped ? "Unequip" : "Equip"} ${stack.representative.name}`}
                completedLabel="Updated"
                icon={stack.isEquipped ? "close-circle-outline" : "shirt-outline"}
                label={stack.isEquipped ? "Unequip" : "Equip"}
                loading={loading}
                mode="tap"
                onAction={() => void handleEquip()}
                variant={stack.isEquipped ? "danger" : "primary"}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
