import type { IconName, ShopItemId } from "../types/app";

export type ShopItemDefinition = {
  id: ShopItemId;
  label: string;
  description: string;
  icon: IconName;
  priceCoins: number;
  weeklyLimit: number;
  effectLabel: string;
};

export const shopItems: readonly ShopItemDefinition[] = [
  {
    id: "streak-shield",
    label: "Streak Shield",
    description: "Protects your streak when an eligible missed day would reset it.",
    effectLabel: "Protects one eligible missed day",
    icon: "shield-checkmark-outline",
    priceCoins: 200,
    weeklyLimit: 3
  },
  {
    id: "energy-elixir",
    label: "Energy Elixir",
    description: "Restores three energy immediately, up to your current maximum.",
    effectLabel: "+3 energy",
    icon: "flash-outline",
    priceCoins: 150,
    weeklyLimit: 3
  },
  {
    id: "xp-charm",
    label: "XP Charm",
    description: "Doubles XP for your next three Daily Quest completions.",
    effectLabel: "2x XP for 3 Daily Quests",
    icon: "sparkles-outline",
    priceCoins: 150,
    weeklyLimit: 3
  }
] as const;

export const shopItemsById = Object.fromEntries(
  shopItems.map((item) => [item.id, item])
) as Record<ShopItemId, ShopItemDefinition>;
