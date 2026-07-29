import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../constants/colors";
import { useHaptics } from "../hooks/useHaptics";
import { shadows } from "../styles/shadows";
import { QuestActionButton } from "./QuestActionButton";

type ConfirmModalProps = {
  confirmLabel: string;
  loading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ConfirmModal({
  confirmLabel,
  loading = false,
  message,
  onCancel,
  onConfirm,
  title,
  visible
}: ConfirmModalProps) {
  const { light } = useHaptics();

  if (!visible) return null;

  const handleCancel = () => {
    light();
    onCancel();
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={handleCancel}
    >
      <SafeAreaView className="flex-1">
        <Pressable className="flex-1 items-center justify-center bg-overlay/50 px-5" onPress={handleCancel}>
          <Pressable onPress={() => {}}>
            <View className="w-full max-w-sm rounded-card border border-line-red bg-surface-card p-5" style={shadows.card}>
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 text-lg font-black text-content">{title}</Text>
                <TouchableOpacity
                  className="ml-2 h-6 w-6 items-center justify-center"
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">
                {message}
              </Text>
              <QuestActionButton
                accessibilityLabel={confirmLabel}
                className="mt-5"
                icon="warning-outline"
                label={confirmLabel}
                loading={loading}
                mode="tap"
                onAction={handleConfirm}
                size="compact"
                variant="danger"
              />
            </View>
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
