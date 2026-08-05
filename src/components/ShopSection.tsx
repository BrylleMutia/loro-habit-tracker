import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { QuestActionButton } from "./QuestActionButton";
import { colors } from "../constants/colors";
import { shopItems, type ShopItemDefinition } from "../constants/shop";
import {
  useGameActions,
  useGameInventory,
  useGameResources,
  useGameShop,
  useGameSync
} from "../contexts/appContext";
import type { ShopItemId, ShopItemStatus } from "../types/app";
import { getEffectiveEnergyCurrent } from "../utility/energy";
import {
  createShopPurchaseIdempotencyKey,
  getActiveXpCharmUses,
  getShopItemStatus
} from "../utility/shop";
import { shadows } from "../styles/shadows";

export function ShopSection() {
  const { purchaseShopItem } = useGameActions();
  const { inventory } = useGameInventory();
  const { coins, energy } = useGameResources();
  const { shop } = useGameShop();
  const { isOnline, mutationInFlight } = useGameSync();
  const [pendingItemId, setPendingItemId] = useState<ShopItemId | null>(null);
  const purchaseKeysRef = useRef(new Map<ShopItemId, string>());
  const activeXpUses = getActiveXpCharmUses(inventory.activeBuffs);
  const effectiveEnergy = getEffectiveEnergyCurrent(energy);

  const handlePurchase = async (itemId: ShopItemId) => {
    if (pendingItemId) return;

    const idempotencyKey =
      purchaseKeysRef.current.get(itemId) ?? createShopPurchaseIdempotencyKey();
    purchaseKeysRef.current.set(itemId, idempotencyKey);
    setPendingItemId(itemId);
    try {
      await purchaseShopItem(itemId, idempotencyKey);
      purchaseKeysRef.current.delete(itemId);
    } catch {
      // The shared sync banner provides retry guidance. Keep the key so a
      // retry after an ambiguous network result cannot double-spend coins.
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <View className="mt-6">
      <View className="flex-row items-end justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-black text-content">Trail Shop</Text>
          <Text className="mt-1 text-xs font-semibold leading-4 text-content-muted">
            Weekly supplies for the next stretch of your adventure.
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs font-black text-content-gold-strong">
            {coins.toLocaleString("en-US")} coins
          </Text>
          <Text className="mt-1 text-micro font-bold text-content-muted">Resets Sunday</Text>
        </View>
      </View>

      <View className="mt-3 gap-2">
        {shopItems.map((definition) => (
          <ShopItemCard
            key={definition.id}
            activeXpUses={activeXpUses}
            coins={coins}
            definition={definition}
            effectiveEnergy={effectiveEnergy}
            energyMax={energy.max}
            isOnline={isOnline}
            mutationInFlight={mutationInFlight}
            pending={pendingItemId === definition.id}
            status={getShopItemStatus(shop, definition.id)}
            onPurchase={() => void handlePurchase(definition.id)}
          />
        ))}
      </View>
    </View>
  );
}

function ShopItemCard({
  activeXpUses,
  coins,
  definition,
  effectiveEnergy,
  energyMax,
  isOnline,
  mutationInFlight,
  onPurchase,
  pending,
  status
}: {
  activeXpUses: number;
  coins: number;
  definition: ShopItemDefinition;
  effectiveEnergy: number;
  energyMax: number;
  isOnline: boolean;
  mutationInFlight: string | null;
  onPurchase: () => void;
  pending: boolean;
  status: ShopItemStatus;
}) {
  const energyFull = definition.id === "energy-elixir" && effectiveEnergy >= energyMax;
  const soldOut = status.remainingPurchases <= 0;
  const insufficientCoins = coins < status.priceCoins;
  const disabled =
    pending ||
    mutationInFlight !== null ||
    !isOnline ||
    soldOut ||
    insufficientCoins ||
    energyFull;
  const buttonLabel = pending
    ? "Buying..."
    : !isOnline
      ? "Reconnect to buy"
      : soldOut
        ? "Sold out this week"
        : energyFull
          ? "Energy is full"
          : insufficientCoins
            ? `Need ${(status.priceCoins - coins).toLocaleString("en-US")} more coins`
            : `Buy for ${status.priceCoins.toLocaleString("en-US")}`;

  return (
    <View className="rounded-card border border-line bg-surface-card p-3" style={shadows.card}>
      <View className="flex-row items-start">
        <View className="h-11 w-11 items-center justify-center rounded-card bg-reward-soft">
          <Ionicons name={definition.icon} size={22} color={colors.gold} />
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 text-sm font-black text-content">{definition.label}</Text>
            <Text className="ml-2 text-sm font-black text-content-gold-strong">
              {status.priceCoins.toLocaleString("en-US")} coins
            </Text>
          </View>
          <Text className="mt-1 text-xs font-semibold leading-4 text-content-muted">
            {definition.description}
          </Text>
          <Text className="mt-2 text-xs font-black text-primary-strong">
            {status.remainingPurchases}/{status.weeklyLimit} purchases remaining this week
          </Text>
          {definition.id === "xp-charm" ? (
            <Text className="mt-1 text-xs font-black text-content-gold-strong">
              Double XP active: {activeXpUses} completion{activeXpUses === 1 ? "" : "s"}
            </Text>
          ) : null}
        </View>
      </View>
      <QuestActionButton
        className="mt-3 w-full"
        disabled={disabled}
        icon="cart-outline"
        label={buttonLabel}
        loading={pending}
        mode="tap"
        onAction={onPurchase}
        variant={disabled ? "secondary" : "primary"}
      />
    </View>
  );
}
