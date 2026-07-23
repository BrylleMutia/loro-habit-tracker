import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { View, type GestureResponderEvent, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { BottomTabs } from "../components/BottomTabs";
import { tabs } from "../constants/home";
import type { TabId } from "../types/app";

const TAB_TRANSITION_DURATION = 260;

type SwipeAxis = "horizontal" | "vertical" | null;

type SwipeStart = {
  pageX: number;
  pageY: number;
};

type TabTransition = {
  direction: 1 | -1;
  from: TabId;
  id: number;
  to: TabId;
};

type TabSceneRenderer = (
  tabId: TabId,
  onNavigateToTab: (tabId: TabId) => void
) => ReactNode;

type PersistentTabHostProps = {
  initialTab: TabId;
  renderScene: TabSceneRenderer;
};

type PersistentTabSceneProps = {
  activeTab: TabId;
  navigateToTab: (tabId: TabId) => void;
  renderScene: TabSceneRenderer;
  tabId: TabId;
  transition: TabTransition | null;
  transitionProgress: SharedValue<number>;
  width: number;
};

function getTabIndex(tabId: TabId) {
  return tabs.findIndex((tab) => tab.id === tabId);
}

const PersistentTabScene = memo(function PersistentTabScene({
  activeTab,
  navigateToTab,
  renderScene,
  tabId,
  transition,
  transitionProgress,
  width
}: PersistentTabSceneProps) {
  const sceneRole = transition
    ? transition.from === tabId
      ? "outgoing"
      : transition.to === tabId
        ? "incoming"
        : "inactive"
    : activeTab === tabId
      ? "active"
      : "inactive";
  const isInteractive = sceneRole === "active";
  const sceneContent = useMemo(
    () => renderScene(tabId, navigateToTab),
    [navigateToTab, renderScene, tabId]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (sceneRole === "outgoing" && transition) {
      return {
        opacity: 1,
        transform: [
          { translateX: -transition.direction * transitionProgress.value * width }
        ]
      };
    }

    if (sceneRole === "incoming" && transition) {
      return {
        opacity: 1,
        transform: [
          {
            translateX: transition.direction * (1 - transitionProgress.value) * width
          }
        ]
      };
    }

    return {
      opacity: sceneRole === "active" ? 1 : 0,
      transform: [{ translateX: 0 }]
    };
  }, [sceneRole, transition, transitionProgress, width]);

  return (
    <Animated.View
      className="absolute inset-0"
      pointerEvents={isInteractive ? "auto" : "none"}
      accessible={isInteractive}
      importantForAccessibility={isInteractive ? "auto" : "no-hide-descendants"}
      style={[
        { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
        animatedStyle
      ]}
    >
      {sceneContent}
    </Animated.View>
  );
});

export function PersistentTabHost({ initialTab, renderScene }: PersistentTabHostProps) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    () => new Set([initialTab])
  );
  const [transition, setTransition] = useState<TabTransition | null>(null);
  const activeTabRef = useRef(activeTab);
  const isTransitioningRef = useRef(false);
  const transitionIdRef = useRef(0);
  const transitionProgress = useSharedValue(1);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const swipeAxisRef = useRef<SwipeAxis>(null);

  const resetSwipe = useCallback(() => {
    swipeStartRef.current = null;
    swipeAxisRef.current = null;
  }, []);

  const finishTransition = useCallback((transitionId: number) => {
    if (transitionId !== transitionIdRef.current) return;
    setTransition(null);
    isTransitioningRef.current = false;
    resetSwipe();
  }, [resetSwipe]);

  const requestTabChange = useCallback(
    (nextTab: TabId) => {
      const fromTab = activeTabRef.current;
      if (fromTab === nextTab || isTransitioningRef.current) return;

      const fromIndex = getTabIndex(fromTab);
      const nextIndex = getTabIndex(nextTab);
      if (fromIndex < 0 || nextIndex < 0) return;

      activeTabRef.current = nextTab;
      setActiveTab(nextTab);
      setMountedTabs((currentTabs) => {
        if (currentTabs.has(nextTab)) return currentTabs;
        const nextTabs = new Set(currentTabs);
        nextTabs.add(nextTab);
        return nextTabs;
      });

      if (reduceMotion) {
        transitionProgress.value = 1;
        resetSwipe();
        return;
      }

      const nextTransition: TabTransition = {
        direction: nextIndex > fromIndex ? 1 : -1,
        from: fromTab,
        id: transitionIdRef.current + 1,
        to: nextTab
      };
      transitionIdRef.current = nextTransition.id;
      isTransitioningRef.current = true;
      setTransition(nextTransition);
      transitionProgress.value = 0;
      transitionProgress.value = withTiming(
        1,
        {
          duration: TAB_TRANSITION_DURATION,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System
        },
        (finished) => {
          if (finished) runOnJS(finishTransition)(nextTransition.id);
        }
      );
    },
    [finishTransition, reduceMotion, resetSwipe, transitionProgress]
  );

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

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
    if (!start || isTransitioningRef.current || swipeAxisRef.current !== null) return;

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
    if (axis === "vertical" || absoluteX < 56 || absoluteX <= absoluteY * 1.2) return;

    const currentIndex = getTabIndex(activeTabRef.current);
    const tabDirection = deltaX < 0 ? 1 : -1;
    const nextTab = tabs[currentIndex + tabDirection]?.id;
    if (nextTab) requestTabChange(nextTab);
  };

  const mountedTabIds = Array.from(mountedTabs);

  return (
    <View
      className="flex-1"
      style={{ minHeight: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetSwipe}
    >
      <View className="flex-1" style={{ minHeight: 0 }}>
        {mountedTabIds.map((tabId) => (
          <PersistentTabScene
            key={tabId}
            activeTab={activeTab}
            navigateToTab={requestTabChange}
            renderScene={renderScene}
            tabId={tabId}
            transition={transition}
            transitionProgress={transitionProgress}
            width={width}
          />
        ))}
      </View>
      <BottomTabs activeTab={activeTab} onChangeTab={requestTabChange} />
    </View>
  );
}
