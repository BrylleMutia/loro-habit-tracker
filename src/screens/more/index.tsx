import { Text, View } from "react-native";

import { PlaceholderScreen } from "../../components/PlaceholderScreen";
import { QuestActionButton } from "../../components/QuestActionButton";
import { moreTab } from "../../constants/home";
import { useAuth } from "../../contexts/authContext";
import { shadows } from "../../styles/shadows";

type MoreScreenProps = {
  onDailyCheckInPress: () => void;
};

export function MoreScreen({ onDailyCheckInPress }: MoreScreenProps) {
  const { isGuest, isSubmitting: isSigningOut, signOut, user } = useAuth();

  return (
    <PlaceholderScreen onDailyCheckInPress={onDailyCheckInPress} tab={moreTab}>
      <View className="rounded-card border border-line bg-surface-card p-4" style={shadows.card}>
        <Text className="text-sm font-black text-content">Account</Text>
        <Text className="mt-1 text-xs font-semibold text-content-muted" numberOfLines={1}>
          {isGuest ? "Guest progress is saved on this device" : user?.email ?? "Signed in to Loro"}
        </Text>
        <QuestActionButton
          accessibilityLabel={isGuest ? "Return to sign in" : "Sign out of Loro"}
          className="mt-4"
          icon={isGuest ? "person-add-outline" : "log-out-outline"}
          label={isGuest ? "Sign in or create account" : "Sign out"}
          loading={isSigningOut}
          mode="tap"
          onAction={() => void signOut().catch(() => undefined)}
          size="compact"
          variant={isGuest ? "secondary" : "danger"}
        />
      </View>
    </PlaceholderScreen>
  );
}
