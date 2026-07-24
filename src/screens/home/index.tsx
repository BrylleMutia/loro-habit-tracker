import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AdventurePathPreview } from "../../components/AdventurePathPreview";
import { DailyQuestCard } from "../../components/DailyQuestCard";
import { LoryThinkingIndicator } from "../../components/LoryThinkingIndicator";
import { PixelParrot } from "../../components/PixelParrot";
import {
   QuestCelebrationModal,
   type LootDropDetails,
} from "../../components/QuestCelebrationModal";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import {
   useGameActions,
   useGameHabits,
   useGameQuests,
   useGameProfile,
} from "../../contexts/appContext";
import { useLoryBriefing } from "../../hooks/useLoryBriefing";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
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

export function HomeScreen({ onDailyCheckInPress }: HomeScreenProps) {
   const contentWidth = useScreenContentWidth();
   const [isPathVisible, setIsPathVisible] = useState(false);
   const [lootDropDetails, setLootDropDetails] =
      useState<LootDropDetails | null>(null);

   if (isPathVisible) {
      return (
         <HabitPathScreen
            onBack={() => setIsPathVisible(false)}
            onDailyCheckInPress={onDailyCheckInPress}
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
               <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />
               <HeroGreeting />
               <ActiveHabitCard />
               <DailyQuestCard onQuestCompleted={setLootDropDetails} />
               <AdventurePathPreview
                  onViewPath={() => setIsPathVisible(true)}
               />
            </View>
         </ScrollView>

         <QuestCelebrationModal
            variant={lootDropDetails ? "loot-drop" : null}
            lootDropDetails={lootDropDetails ?? undefined}
            onClose={() => setLootDropDetails(null)}
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
                           className={`ml-2 h-7 w-7 items-center justify-center rounded-card border ${
                              canRefreshBriefing
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
                     <Text className="mt-2 text-sm font-semibold leading-5 text-content">
                        {briefing || activeHabit.dailyPrompt}
                     </Text>
                  )}
               </View>
            </View>
         </View>
      </View>
   );
}

function ActiveHabitCard() {
   const {
      activeHabit,
      activeHabitId,
      activeAdventure,
      activeHabitProgressPercent,
      habitList,
   } = useGameHabits();
   const { setActiveHabit } = useGameActions();
   const focusLocation = activeAdventure.focusLocation;

   return (
      <View
         className="mt-4 rounded-card border border-line bg-surface-card p-4"
         style={shadows.card}
      >
         <View className="flex-row items-end justify-between">
            <View className="flex-1 pr-3">
               <Text className="text-micro font-black uppercase tracking-wide text-content-muted">
                  Select loadout
               </Text>
               <Text className="mt-1 text-lg font-black text-content">
                  Choose your trail
               </Text>
            </View>
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
                     ? `${focusLocation.section.title} | Day ${focusLocation.node.day} of ${focusLocation.section.nodes.length}`
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

               return (
                  <View key={habit.id} className="mb-2 w-1/3 px-1">
                     <TouchableOpacity
                        className={`h-11 flex-row items-center justify-center rounded-card border px-2 ${
                           isActive
                              ? "border-primary bg-primary-soft"
                              : "border-line bg-surface-panel"
                        }`}
                        activeOpacity={0.82}
                        accessibilityLabel={`Show ${habit.label} habit`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        onPress={() => setActiveHabit(habit.id)}
                     >
                        <Ionicons
                           name={habit.icon}
                           size={16}
                           color={isActive ? colors.blueDark : colors.muted}
                        />
                        <Text
                           className={`ml-1 text-micro font-black ${
                              isActive
                                 ? "text-primary-strong"
                                 : "text-content-muted"
                           }`}
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
