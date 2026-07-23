import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../constants/colors";
import { equipmentItemsById, equipmentRaritiesById } from "../constants/equipment";
import { equipmentAttributes, loadoutSlots } from "../constants/profile";
import { shadows } from "../styles/shadows";
import type { InventoryStack } from "../types/app";
import type { EquipmentLootPreview } from "../utility/equipmentLoot";
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
  loading = false,
  onClose,
  onEquip,
  preview = null,
  stack = null
}: {
  loading?: boolean;
  onClose: () => void;
  onEquip?: (itemId: string) => Promise<boolean>;
  preview?: EquipmentLootPreview | null;
  stack?: InventoryStack | null;
}) {
  if (!stack && !preview) return null;

  const itemName = stack?.representative.name ?? preview?.definition.name ?? "Equipment";
  const itemDefinition = stack
    ? equipmentItemsById[stack.representative.itemDefinitionId]
    : preview?.definition;
  const rarityId = stack?.representative.rarity ?? preview?.rarity ?? "common";
  const rarity = equipmentRaritiesById[rarityId];
  const slotId = stack?.representative.slotId ?? preview?.definition.slotId ?? "helmet";
  const setName = stack?.representative.setName ?? preview?.definition.setName ?? "Trail gear";
  const stats = stack?.representative.stats ?? preview?.stats ?? {};
  const actionItemId = stack?.equippedItemId ?? stack?.representative.id;

  const handleEquip = async () => {
    if (!stack || !onEquip || !actionItemId) return;
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
                {itemName}
              </Text>
              <View
                className="mt-2 self-start rounded-pill px-2 py-1"
                style={{ backgroundColor: colors.raritySoft[rarityId] }}
              >
                <Text className="text-micro font-black" style={{ color: colors.rarity[rarityId] }}>
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
            <View
              className="flex-row items-center rounded-card border p-3"
              style={{
                backgroundColor: colors.raritySoft[rarityId],
                borderColor: colors.rarity[rarityId]
              }}
            >
              <View
                className="h-24 w-24 items-center justify-center rounded-card border bg-surface-card"
                style={{ borderColor: colors.rarity[rarityId] }}
              >
                {itemDefinition ? (
                  <Image
                    source={itemDefinition.image}
                    resizeMode="contain"
                    className="h-20 w-20"
                    accessibilityLabel={itemName}
                  />
                ) : (
                  <Ionicons name="cube-outline" size={34} color={colors.grayIcon} />
                )}
              </View>
              <View className="ml-3 min-w-0 flex-1">
                <Text className="text-xs font-black text-content">{setName}</Text>
                <Text className="mt-2 text-micro font-extrabold uppercase text-content-muted">
                  {stack ? (stack.isEquipped ? "Currently equipped" : "Not equipped") : "Guild Quest reward preview"}
                </Text>
                {stack ? (
                  <View className="mt-2 self-start rounded-pill bg-reward-soft px-2 py-1">
                    <Text className="text-micro font-black text-content-gold">{stack.totalValue} total value</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mt-3 rounded-card border border-line bg-surface-card px-3">
              <DetailRow label="Slot" value={getSlotLabel(slotId)} />
              <DetailRow label="Set" value={setName} />
              {stack ? (
                <>
                  <DetailRow label="Owned" value={`x${stack.quantity}`} />
                  <DetailRow label="First acquired" value={formatFullDate(stack.firstAcquiredAt)} />
                </>
              ) : null}
            </View>

            <View className="mt-3 rounded-card border border-line bg-surface-card p-3">
              <Text className="text-xs font-black uppercase text-content-muted">Stats</Text>
              <View className="mt-2 flex-row flex-wrap gap-1">
                {Object.entries(stats).map(([attributeId, amount]) => {
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

            {stack && onEquip ? (
              <View className="mt-4">
                <QuestActionButton
                  accessibilityLabel={`${stack.isEquipped ? "Unequip" : "Equip"} ${itemName}`}
                  completedLabel="Updated"
                  icon={stack.isEquipped ? "close-circle-outline" : "shirt-outline"}
                  label={stack.isEquipped ? "Unequip" : "Equip"}
                  loading={loading}
                  mode="tap"
                  onAction={() => void handleEquip()}
                  variant={stack.isEquipped ? "danger" : "primary"}
                />
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
