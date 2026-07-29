import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AdventurePathPreview } from "../../components/AdventurePathPreview";
import { DailyQuestCard } from "../../components/DailyQuestCard";
import { HabitIconWithStatus } from "../../components/HabitIconWithStatus";
import { InventoryStackDetailsModal } from "../../components/InventoryStackDetailsModal";
import { LoryThinkingIndicator } from "../../components/LoryThinkingIndicator";
import type { NewUnlockDetails } from "../../components/NewUnlockCelebrationModal";
import { PixelParrot } from "../../components/PixelParrot";
import {
   QuestCelebrationModal,
   type LootDropPage,
   type LootDropDetails,
} from "../../components/QuestCelebrationModal";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import {
   useGameActions,
   useGameHabits,
   useGameInventory,
   useGameQuests,
   useGameProfile,
   useGameSync,
} from "../../contexts/appContext";
import { useLoryBriefing } from "../../hooks/useLoryBriefing";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
import type { HabitId, IconName } from "../../types/app";
import { groupInventoryItems } from "../../utility/inventory";
import { HabitPathScreen } from "./HabitPathScreen";
import Animated, {
   cancelAnimation,
   Easing,
   useAnimatedStyle,
   useReducedMotion,
   useSharedValue,
   withRepeat,
   withSequence,
   withTiming,
} from "react-native-reanimated";

type HomeScreenProps = {
   onDailyCheckInPress: () => void;
   onLootVisibilityChange: (visible: boolean) => void;
   onNewUnlock: (details: NewUnlockDetails) => void;
  onNavigateToMoreSettings?: () => void;
   onNavigateToTab?: (tab: import("../../types/app").TabId) => void;
};

const LORY_BRIEFING_MAX_LINES = 4;
const LORY_BRIEFING_LINE_HEIGHT = 20;
const LORY_BRIEFING_MAX_HEIGHT =
   LORY_BRIEFING_MAX_LINES * LORY_BRIEFING_LINE_HEIGHT;

// Keep the active habit accents aligned with the onboarding selector palette
// while giving every habit its own visual anchor on the home screen.
const activeHabitAccentColors: Record<HabitId, string> = {
   exercise: colors.blueDark,
   reading: colors.rarity.rare,
   journaling: colors.red,
   water: colors.blue,
   sleep: colors.rarity.epic,
   outdoors: colors.green,
};

function getTimeOfDayGreeting(date: Date, timeZone: string) {
   try {
      const hourPart = new Intl.DateTimeFormat("en-US", {
         hour: "numeric",
         hourCycle: "h23",
         timeZone,
      })
         .formatToParts(date)
         .find((part) => part.type === "hour")?.value;
      const hour = Number(hourPart);

      if (hour < 12) return "Good morning,";
      if (hour < 18) return "Good afternoon,";
      return "Good evening,";
   } catch {
      const hour = date.getHours();
      if (hour < 12) return "Good morning,";
      if (hour < 18) return "Good afternoon,";
      return "Good evening,";
   }
}

export function HomeScreen({
   onDailyCheckInPress,
   onLootVisibilityChange,
   onNewUnlock,
   onNavigateToMoreSettings,
   onNavigateToTab
}: HomeScreenProps) {
   const contentWidth = useScreenContentWidth();
   const [isPathVisible, setIsPathVisible] = useState(false);
   const [lootDropDetails, setLootDropDetails] =
      useState<LootDropDetails | null>(null);
   const [isLootCelebrationVisible, setIsLootCelebrationVisible] = useState(false);
   const [lootDropPage, setLootDropPage] = useState<LootDropPage>("rewards");
   const [selectedLootItem, setSelectedLootItem] = useState<LootDropDetails["lootItem"] | null>(null);
   const [pendingItemId, setPendingItemId] = useState<string | null>(null);
   const { inventory } = useGameInventory();
   const { profile } = useGameProfile();
   const { equipItem } = useGameActions();
   const { mutationInFlight } = useGameSync();
   const selectedLootItemId = selectedLootItem?.id ?? null;
   const inventoryItemsForDetails = useMemo(() => {
      if (
         !selectedLootItem ||
         inventory.items.some((item) => item.id === selectedLootItem.id)
      ) {
         return inventory.items;
      }
      return [...inventory.items, selectedLootItem];
   }, [inventory.items, selectedLootItem]);
   const inventoryStacks = useMemo(
      () =>
         groupInventoryItems(
            inventoryItemsForDetails,
            profile.equippedItemIds,
            "rarity",
            "desc"
         ),
      [inventoryItemsForDetails, profile.equippedItemIds]
   );
   const selectedLootStack = useMemo(
      () =>
         inventoryStacks.find((stack) =>
            stack.items.some((item) => item.id === selectedLootItemId)
         ) ?? null,
      [inventoryStacks, selectedLootItemId]
   );

   useEffect(() => {
      onLootVisibilityChange(isLootCelebrationVisible || selectedLootItemId !== null);
   }, [isLootCelebrationVisible, onLootVisibilityChange, selectedLootItemId]);

   const openLootCelebration = (details: LootDropDetails) => {
      setLootDropDetails(details);
      setLootDropPage("rewards");
      setIsLootCelebrationVisible(true);
   };

   const closeLootCelebration = () => {
      setIsLootCelebrationVisible(false);
      setLootDropDetails(null);
      setLootDropPage("rewards");
   };

   const openLootItemDetails = (item: LootDropDetails["lootItem"]) => {
      const detailsItems = inventory.items.some((existingItem) => existingItem.id === item.id)
         ? inventory.items
         : [...inventory.items, item];
      const stack = groupInventoryItems(
         detailsItems,
         profile.equippedItemIds,
         "rarity",
         "desc"
      ).find((candidate) =>
         candidate.items.some((candidateItem) => candidateItem.id === item.id)
      );
      if (!stack) return;
      setSelectedLootItem(item);
      setIsLootCelebrationVisible(false);
   };

   const closeLootItemDetails = () => {
      setSelectedLootItem(null);
      if (lootDropDetails) setIsLootCelebrationVisible(true);
   };

   const handleEquip = async (itemId: string) => {
      setPendingItemId(itemId);
      try {
         await equipItem(itemId);
         return true;
      } catch {
         return false;
      } finally {
         setPendingItemId(null);
      }
   };

   if (isPathVisible) {
      return (
         <HabitPathScreen
            onBack={() => setIsPathVisible(false)}
            onDailyCheckInPress={onDailyCheckInPress}
            onNewUnlock={onNewUnlock}
         />
      );
   }

   return (
      <>
         <ScrollView
            className="flex-1"
            contentContainerClassName="pb-28 pt-3"
            contentContainerStyle={{ width: "100%" }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            style={{ minHeight: 0 }}
          >
             <View className="self-center" style={{ width: contentWidth }}>
                <View className="items-start">
                   <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />
                </View>
                <HeroGreeting />
                <ActiveHabitCard onNavigateToMoreSettings={onNavigateToMoreSettings} />
               <DailyQuestCard onQuestCompleted={openLootCelebration} />
               <AdventurePathPreview
                  onViewPath={() => setIsPathVisible(true)}
               />
            </View>
         </ScrollView>

         <InventoryStackDetailsModal
            loading={mutationInFlight === "equipment" && pendingItemId !== null}
            onClose={closeLootItemDetails}
            onEquip={handleEquip}
            stack={selectedLootStack}
         />

         <QuestCelebrationModal
            variant={isLootCelebrationVisible && lootDropDetails ? "loot-drop" : null}
            lootDropDetails={lootDropDetails ?? undefined}
            lootDropPage={lootDropPage}
            onClose={closeLootCelebration}
            onLootDropPageChange={setLootDropPage}
            onLootItemPress={openLootItemDetails}
         />
      </>
   );
}

function HeroGreeting() {
   const { activeHabit } = useGameHabits();
   const { profile } = useGameProfile();
   const { timeZone } = useGameQuests();
   const {
      briefing,
      canRefreshBriefing,
      isLoading,
      refreshBriefing,
      refreshCount,
      showRefreshButton,
   } = useLoryBriefing();
   const [now, setNow] = useState(() => new Date());
   const thinkingProgress = useSharedValue(0);
   const reduceMotion = useReducedMotion();

   useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60 * 60 * 1_000);
      return () => clearInterval(interval);
   }, []);

   const greeting = getTimeOfDayGreeting(now, timeZone);

   useEffect(() => {
      cancelAnimation(thinkingProgress);

      if (!isLoading || reduceMotion) {
         thinkingProgress.value = 0;
         return;
      }

      thinkingProgress.value = withRepeat(
         withSequence(
            withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 280 }),
         ),
         -1,
         false,
      );

      return () => cancelAnimation(thinkingProgress);
   }, [isLoading, reduceMotion, thinkingProgress]);

   const thinkingParrotStyle = useAnimatedStyle(() => ({
      transform: [
         { translateY: -thinkingProgress.value * 3 },
         { rotate: `${thinkingProgress.value * 4 - 2}deg` },
      ],
   }));

   return (
      <View className="mt-5 overflow-hidden rounded-card border border-line-blue bg-canvas-sky">
         <View className="h-hero pt-4">
            <Image
               source={images.headerBackground}
               resizeMode="cover"
               className="absolute inset-0 h-hero w-full"
            />
            <View className="absolute bottom-8 right-1">
               <Animated.View style={thinkingParrotStyle}>
                  <PixelParrot size="lg" mirrorX />
               </Animated.View>
            </View>
            <View className="pl-5 pr-5">
               <View className="flex flex-row justify-between items-start mt-3">
                  <View>
                     <Text className="text-base font-bold text-content">
                        {greeting}
                     </Text>
                     <View className="mt-1 flex-row items-center">
                        <Text className="text-3xl font-black text-content">
                           {profile.name}!
                        </Text>
                        <Ionicons
                           name="partly-sunny"
                           size={25}
                           color={colors.gold}
                           style={{ marginLeft: 8 }}
                        />
                     </View>
                     <Text className="mt-1 text-xs font-bold text-content-muted">
                        Your trail is waiting.
                     </Text>
                  </View>
                  <View className="flex-row items-center">
                     <Ionicons
                        name="map-outline"
                        size={15}
                        color={colors.blueDark}
                     />
                     <Text className="ml-1 text-micro font-black uppercase tracking-wide text-primary-strong">
                        World 01 / Trail map
                     </Text>
                  </View>
               </View>

               <View
                  className="mt-4 max-w-speech rounded-card border-l-4 border-primary bg-surface-card pl-3 pr-2 pt-3 pb-3"
                  style={shadows.card}
               >
                  <View className="flex-row items-center">
                     <Ionicons
                        name="sparkles"
                        size={14}
                        color={colors.blueDark}
                     />
                     <Text className="ml-1 text-micro font-black uppercase tracking-wide text-primary-strong">
                        Lory's briefing
                     </Text>
                     {showRefreshButton ? (
                        <TouchableOpacity
                           className={`ml-2 h-7 w-7 items-center justify-center rounded-card border ${canRefreshBriefing
                                 ? "border-line-primary bg-primary-soft"
                                 : "border-line bg-surface-panel"
                              }`}
                           activeOpacity={0.8}
                           accessibilityLabel={
                              isLoading
                                 ? "Generating a new Lory briefing"
                                 : canRefreshBriefing
                                    ? `Refresh Lory briefing. ${2 - refreshCount} refreshes remaining today`
                                    : refreshCount >= 2
                                       ? "Daily Lory briefing refresh limit reached"
                                       : "Lory briefing refresh unavailable"
                           }
                           accessibilityRole="button"
                           accessibilityState={{ disabled: !canRefreshBriefing }}
                           disabled={!canRefreshBriefing}
                           onPress={() => void refreshBriefing()}
                        >
                           <Ionicons
                              name="refresh-outline"
                              size={15}
                              color={canRefreshBriefing ? colors.blueDark : colors.muted}
                           />
                        </TouchableOpacity>
                     ) : null}
                  </View>
                  {isLoading ? (
                     <View className="mt-2">
                        <LoryThinkingIndicator />
                     </View>
                  ) : (
                     <ScrollView
                        className="mt-2"
                        style={{ maxHeight: LORY_BRIEFING_MAX_HEIGHT }}
                        contentContainerStyle={{ flexGrow: 0 }}
                        nestedScrollEnabled
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator
                     >
                        <Text className="text-sm font-semibold leading-5 text-content">
                           {briefing || activeHabit.dailyPrompt}
                        </Text>
                     </ScrollView>
                  )}
               </View>
            </View>
         </View>
      </View>
   );
}

function ActiveHabitCard({ onNavigateToMoreSettings }: { onNavigateToMoreSettings?: () => void }) {
   const {
      activeHabit,
      activeHabitId,
      activeAdventure,
      activeHabitProgressPercent,
      habitList,
   } = useGameHabits();
   const { setActiveHabit } = useGameActions();
   const { todayDateKey } = useGameSync();
   const focusLocation = activeAdventure.focusLocation;

   return (
      <View
         className="mt-4 rounded-card border border-line bg-surface-card p-4"
         style={shadows.card}
      >
          <View className="flex-row items-end justify-between">
             <View className="flex-1 pr-3">
                <Text className="text-xs font-extrabold uppercase text-content-muted">
                   Today's trail
                </Text>
             </View>
             <View className="flex-row items-center gap-1">
                <View className="flex-row items-center rounded-pill border border-line-primary bg-surface-blue px-2 py-1">
                   <Ionicons
                      name="flag-outline"
                      size={13}
                      color={colors.blueDark}
                   />
                   <Text className="ml-1 text-micro font-black text-primary-strong">
                      {focusLocation
                         ? `Day ${focusLocation.node.day} of ${focusLocation.section.nodes.length}`
                         : "Complete"}
                   </Text>
                </View>
                {onNavigateToMoreSettings ? (
                   <TouchableOpacity
                      className="h-7 w-7 items-center justify-center rounded-card border border-line-primary bg-surface-blue"
                      activeOpacity={0.7}
                      accessibilityLabel="Habit target settings"
                      accessibilityRole="button"
                      onPress={onNavigateToMoreSettings}
                   >
                      <Ionicons name="settings-outline" size={14} color={colors.blueDark} />
                   </TouchableOpacity>
                ) : null}
             </View>
          </View>

         <View className="mt-4 flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-card border border-line-reward bg-reward-soft">
               <Ionicons name={activeHabit.icon} size={24} color={colors.red} />
            </View>
            <View className="ml-3 flex-1">
               <Text className="text-xl font-black text-content-strong">
                  {activeHabit.label}
               </Text>
               <Text className="mt-1 text-xs font-bold text-content-muted">
                  {focusLocation
                     ? `${focusLocation.section.title}`
                     : "All available chapters complete"}
               </Text>
            </View>
         </View>

         <View className="mt-3 h-3 overflow-hidden rounded-pill bg-line-progress">
            <View
               className="h-full rounded-pill bg-primary-strong"
               style={{ width: `${activeHabitProgressPercent}%` }}
            />
         </View>

         <View className="-mx-1 mt-4 flex-row flex-wrap">
            {habitList.map((habit) => {
               const isActive = habit.id === activeHabitId;
               const completedToday = habit.lastCompletedDateKey === todayDateKey;
               const inProgress =
                  habit.activeTimedQuest !== null &&
                  habit.activeTimedQuest.startedOn === todayDateKey;

               const borderClass = isActive
                  ? "border-primary-strong bg-primary-soft"
                  : "border-line-muted bg-surface-muted";

               const statusIcon: IconName | null = completedToday
                  ? "checkmark-circle"
                  : inProgress
                     ? "play-circle-outline"
                     : null;
               let statusIconColor = colors.muted;

               if (completedToday) {
                  statusIconColor = colors.green;
               } else if (inProgress) {
                  statusIconColor = colors.gold;
               }

               const labelClass = isActive
                  ? "text-primary-strong"
                  : completedToday
                     ? "text-content-green"
                     : inProgress
                        ? "text-content-gold"
                        : "text-content-muted";

               return (
                  <View key={habit.id} className="mb-2 w-1/3 px-1">
                     <TouchableOpacity
                        className={`h-11 flex-row items-center justify-center rounded-card border border-l-4 px-2 ${borderClass}`}
                        style={{ borderLeftColor: activeHabitAccentColors[habit.id] }}
                        activeOpacity={0.82}
                        accessibilityLabel={`${habit.label}${completedToday ? ", completed" : inProgress ? ", in progress" : ""}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        onPress={() => setActiveHabit(habit.id)}
                     >
                        <HabitIconWithStatus
                           habitIcon={habit.icon}
                           iconSize={16}
                           containerClassName="relative h-6 w-6 items-center justify-center -left-1.5"
                           mainIconColor={isActive ? colors.blueDark : colors.muted}
                           statusIcon={statusIcon}
                           statusIconColor={statusIconColor}
                        />
                        <Text
                           className={`ml-1 text-micro font-black ${labelClass} -left-1.5`}
                           numberOfLines={1}
                        >
                           {habit.label}
                        </Text>
                     </TouchableOpacity>
                  </View>
               );
            })}
         </View>
      </View>
   );
}
