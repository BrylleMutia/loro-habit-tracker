import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { colors } from "../constants/colors";
import type { IconName } from "../types/app";

type AuthFieldProps = {
  autoCapitalize?: "characters" | "none" | "sentences" | "words";
  autoComplete?: ComponentProps<typeof TextInput>["autoComplete"];
  icon?: IconName;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
  secureTextEntry?: boolean;
  value: string;
};

export function AuthField({
  autoCapitalize = "none",
  autoComplete,
  icon,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  returnKeyType,
  secureTextEntry,
  value
}: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View className="gap-2">
      <Text className="text-xs font-extrabold text-content-muted">{label}</Text>
      <View className="h-14 flex-row items-center rounded-card border border-line-blue bg-surface-card px-3">
        {icon ? <Ionicons name={icon} size={19} color={colors.blueDark} /> : null}
        <TextInput
          className={`${icon ? "ml-3" : ""} flex-1 text-base font-semibold text-content`}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          accessibilityLabel={label}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.tabInactive}
          returnKeyType={returnKeyType}
          secureTextEntry={isPassword && !passwordVisible}
          value={value}
        />
        {isPassword ? (
          <Pressable
            className="h-10 w-10 items-center justify-center"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setPasswordVisible((current) => !current)}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={colors.grayIcon}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
