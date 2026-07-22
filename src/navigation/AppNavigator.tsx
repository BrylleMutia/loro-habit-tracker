import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Animated as NativeAnimated, Easing, View, type GestureResponderEvent } from "react-native";
import { DefaultTheme, NavigationContainer, StackActions, useNavigationContainerRef } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import {
  createStackNavigator,
  TransitionPresets,
  type StackCardStyleInterpolator,
  type StackNavigationOptions
} from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import { BottomTabs } from "../components/BottomTabs";
import { PlaceholderScreen } from "../components/PlaceholderScreen";
import { QuestCelebrationModal } from "../components/QuestCelebrationModal";
import { SyncStatusBanner } from "../components/SyncStatusBanner";
import { colors } from "../constants/colors";
import { tabs } from "../constants/home";
import { useAppState } from "../contexts/appContext";
import { HomeScreen } from "../screens/home";
import { MoreScreen } from "../screens/more";
import { ProfileScreen } from "../screens/profile";
import { ShopScreen } from "../screens/shop";
import type { TabId } from "../types/app";

type TabTransitionDirection = 1 | -1;

type TabRouteParams = {
  transitionDirection?: TabTransitionDirection;
};

type AppStackParamList = {
  profile: TabRouteParams | undefined;
  shop: TabRouteParams | undefined;
  home: TabRouteParams | undefined;
  quests: TabRouteParams | undefined;
  more: TabRouteParams | undefined;
};

type NavigationCallbacks = {
  onDailyCheckInPress: () => void;
  onNavigateToTab: (tab: TabId) => void;
};

type SwipeAxis = "horizontal" | "vertical" | null;

type SwipeStart = {
  pageX: number;
  pageY: number;
};

const Stack = createStackNavigator<AppStackParamList>();
const NavigationCallbacksContext = createContext<NavigationCallbacks | null>(null);
const TAB_TRANSITION_DURATION = 260;

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
    border: colors.line,
    card: "transparent",
    primary: colors.blue
  }
};

const tabTransitionSpec: NonNullable<StackNavigationOptions["transitionSpec"]> = {
  open: {
    animation: "timing",
    config: {
      duration: TAB_TRANSITION_DURATION,
      easing: Easing.out(Easing.cubic)
    }
  },
  close: {
    animation: "timing",
    config: {
      duration: TAB_TRANSITION_DURATION,
      easing: Easing.out(Easing.cubic)
    }
  }
};

const baseStackOptions: StackNavigationOptions = {
  ...TransitionPresets.SlideFromRightIOS,
  animationTypeForReplace: "push",
  cardStyle: {
    backgroundColor: "transparent",
    flex: 1
  },
  gestureEnabled: false,
  headerShown: false,
  transitionSpec: tabTransitionSpec
};

function getTabIndex(tabId: TabId) {
  return tabs.findIndex((tab) => tab.id === tabId);
}

function createTabCardInterpolator(
  direction: TabTransitionDirection
): StackCardStyleInterpolator {
  return ({ current, inverted, layouts, next }) => {
    const progress = NativeAnimated.add(current.progress, next?.progress ?? 0);
    const translateX = progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [
        direction * layouts.screen.width,
        0,
        -direction * layouts.screen.width
      ],
      extrapolate: "clamp"
    });

    return {
      cardStyle: {
        transform: [{ translateX: NativeAnimated.multiply(translateX, inverted) }]
      }
    };
  };
}

const slideFromRight = createTabCardInterpolator(1);
const slideFromLeft = createTabCardInterpolator(-1);

function useNavigationCallbacks() {
  const callbacks = useContext(NavigationCallbacksContext);
  if (!callbacks) {
    throw new Error("Navigation callbacks are only available inside AppNavigator.");
  }
  return callbacks;
}

function HomeRouteScreen() {
  const { onDailyCheckInPress } = useNavigationCallbacks();
  return <HomeScreen onDailyCheckInPress={onDailyCheckInPress} />;
}

function ProfileRouteScreen() {
  const { onNavigateToTab } = useNavigationCallbacks();
  return <ProfileScreen onNavigateToTab={onNavigateToTab} />;
}

function ShopRouteScreen() {
  const { onDailyCheckInPress } = useNavigationCallbacks();
  return <ShopScreen onDailyCheckInPress={onDailyCheckInPress} />;
}

function MoreRouteScreen() {
  const { onDailyCheckInPress } = useNavigationCallbacks();
  return <MoreScreen onDailyCheckInPress={onDailyCheckInPress} />;
}

function QuestsRouteScreen() {
  const { onDailyCheckInPress } = useNavigationCallbacks();
  const tab = tabs.find((item) => item.id === "quests") ?? tabs[0];

  return <PlaceholderScreen onDailyCheckInPress={onDailyCheckInPress} tab={tab} />;
}

export function AppNavigator() {
  const {
    activeTab,
    claimDailyCheckIn,
    dailyCheckIn,
    dailyCheckInClaimedToday,
    isOnline,
    mutationInFlight,
    setActiveTab,
    todayDateKey
  } = useAppState();
  const navigationRef = useNavigationContainerRef<AppStackParamList>();
  const reduceMotion = useReducedMotion();
  const [isDailyCheckInVisible, setIsDailyCheckInVisible] = useState(false);
  const promptedDateKeyRef = useRef<string | null>(null);
  const activeTabRef = useRef<TabId>(activeTab);
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const swipeAxisRef = useRef<SwipeAxis>(null);

  const trailStampDetails = useMemo(
    () => ({
      actionLabel: "Hold to check in",
      badgeLabel: "Daily check-in",
      coinReward: dailyCheckIn.rewardCoins,
      description: "Lory stamped today's visit and packed fresh supplies for the trail.",
      energyReward: dailyCheckIn.rewardEnergy,
      title: "Welcome back!"
    }),
    [dailyCheckIn.rewardCoins, dailyCheckIn.rewardEnergy]
  );

  const resetSwipe = useCallback(() => {
    swipeStartRef.current = null;
    swipeAxisRef.current = null;
  }, []);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const finishTransition = useCallback(() => {
    isTransitioningRef.current = false;
    clearTransitionTimeout();
    resetSwipe();
  }, [clearTransitionTimeout, resetSwipe]);

  const markTransitioning = useCallback(() => {
    isTransitioningRef.current = true;
    clearTransitionTimeout();
    transitionTimeoutRef.current = setTimeout(
      finishTransition,
      reduceMotion ? 0 : TAB_TRANSITION_DURATION + 80
    );
  }, [clearTransitionTimeout, finishTransition, reduceMotion]);

  useEffect(() => {
    if (dailyCheckInClaimedToday) {
      setIsDailyCheckInVisible(false);
      return;
    }

    if (promptedDateKeyRef.current !== todayDateKey) {
      promptedDateKeyRef.current = todayDateKey;
      setIsDailyCheckInVisible(true);
    }
  }, [dailyCheckInClaimedToday, todayDateKey]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => clearTransitionTimeout, [clearTransitionTimeout]);

  const openDailyCheckIn = useCallback(() => {
    if (!dailyCheckInClaimedToday) {
      setIsDailyCheckInVisible(true);
    }
  }, [dailyCheckInClaimedToday]);

  const claimDailyReward = useCallback(async () => {
    try {
      await claimDailyCheckIn();
      setIsDailyCheckInVisible(false);
    } catch {
      // The modal stays open while the sync banner provides retry guidance.
    }
  }, [claimDailyCheckIn]);

  const requestTabChange = useCallback(
    (nextTab: TabId) => {
      const fromTab = activeTabRef.current;
      if (fromTab === nextTab || !navigationRef.isReady()) return;

      const fromIndex = getTabIndex(fromTab);
      const nextIndex = getTabIndex(nextTab);
      if (fromIndex < 0 || nextIndex < 0) return;

      const direction: TabTransitionDirection = nextIndex > fromIndex ? 1 : -1;
      markTransitioning();
      navigationRef.setParams({ transitionDirection: direction });
      activeTabRef.current = nextTab;
      setActiveTab(nextTab);
      navigationRef.dispatch(
        StackActions.replace(nextTab, { transitionDirection: direction })
      );
    },
    [markTransitioning, navigationRef, setActiveTab]
  );

  const navigationCallbacks = useMemo(
    () => ({
      onDailyCheckInPress: openDailyCheckIn,
      onNavigateToTab: requestTabChange
    }),
    [openDailyCheckIn, requestTabChange]
  );

  const handleTransitionStart = useCallback(() => {
    isTransitioningRef.current = true;
    resetSwipe();
  }, [resetSwipe]);

  const screenListeners = useMemo(
    () => ({
      transitionEnd: finishTransition,
      transitionStart: handleTransitionStart
    }),
    [finishTransition, handleTransitionStart]
  );

  const handleTouchStart = (event: GestureResponderEvent) => {
    if (isTransitioningRef.current || event.nativeEvent.touches.length > 1) {
      resetSwipe();
      return;
    }

    swipeStartRef.current = {
      pageX: event.nativeEvent.pageX,
      pageY: event.nativeEvent.pageY
    };
    swipeAxisRef.current = null;
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    const start = swipeStartRef.current;
    if (!start || isTransitioningRef.current) return;
    if (swipeAxisRef.current !== null) return;

    const deltaX = event.nativeEvent.pageX - start.pageX;
    const deltaY = event.nativeEvent.pageY - start.pageY;
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    if (absoluteX < 12 && absoluteY < 12) return;

    if (absoluteX > absoluteY * 1.2) {
      swipeAxisRef.current = "horizontal";
    } else if (absoluteY > absoluteX * 1.2) {
      swipeAxisRef.current = "vertical";
    }
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    const start = swipeStartRef.current;
    const axis = swipeAxisRef.current;
    resetSwipe();
    if (!start || isTransitioningRef.current) return;

    const deltaX = event.nativeEvent.pageX - start.pageX;
    const deltaY = event.nativeEvent.pageY - start.pageY;
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);
    if (
      axis === "vertical" ||
      absoluteX < 56 ||
      absoluteX <= absoluteY * 1.2
    ) {
      return;
    }

    const currentIndex = getTabIndex(activeTabRef.current);
    const tabDirection = deltaX < 0 ? 1 : -1;
    const nextTab = tabs[currentIndex + tabDirection]?.id;
    if (nextTab) {
      requestTabChange(nextTab);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-mint">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        <SyncStatusBanner />
        <View
          className="flex-1"
          style={{ minHeight: 0 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={resetSwipe}
        >
          <NavigationCallbacksContext.Provider value={navigationCallbacks}>
            <NavigationContainer
              ref={navigationRef}
              theme={navigationTheme}
              onReady={() => {
                activeTabRef.current = activeTab;
              }}
            >
              <Stack.Navigator
                initialRouteName={activeTab}
                screenListeners={screenListeners}
                screenOptions={({ route }: { route: RouteProp<AppStackParamList, TabId> }) => ({
                  ...baseStackOptions,
                  animationEnabled: !reduceMotion,
                  cardStyleInterpolator:
                    route.params?.transitionDirection === -1
                      ? slideFromLeft
                      : slideFromRight
                })}
              >
                <Stack.Screen component={ProfileRouteScreen} name="profile" />
                <Stack.Screen component={ShopRouteScreen} name="shop" />
                <Stack.Screen component={HomeRouteScreen} name="home" />
                <Stack.Screen component={QuestsRouteScreen} name="quests" />
                <Stack.Screen component={MoreRouteScreen} name="more" />
              </Stack.Navigator>
            </NavigationContainer>
          </NavigationCallbacksContext.Provider>
        </View>
        <BottomTabs activeTab={activeTab} onChangeTab={requestTabChange} />
      </LinearGradient>
      <QuestCelebrationModal
        variant={isDailyCheckInVisible ? "trail-stamp" : null}
        onClose={() => setIsDailyCheckInVisible(false)}
        onTrailStampAction={claimDailyReward}
        trailStampActionDisabled={!isOnline || mutationInFlight !== null}
        trailStampActionMode="hold"
        trailStampDetails={trailStampDetails}
      />
    </SafeAreaView>
  );
}
