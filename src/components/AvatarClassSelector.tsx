import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import {
  avatarClassOptions,
  getAvatarImage,
  type AvatarGender
} from "../constants/avatarClasses";
import { colors } from "../constants/colors";
import { shadows } from "../styles/shadows";
import type { AvatarClassId } from "../types/app";

type AvatarClassSelectorProps = {
  gender: AvatarGender;
  onClassChange: (classId: AvatarClassId) => void;
  onGenderChange: (gender: AvatarGender) => void;
  selectedClassId: AvatarClassId;
};

const genderOptions = [
  { id: "male", icon: "male" },
  { id: "female", icon: "female" }
] as const;

const avatarPreviewStyle = { height: 112, width: 112 } as const;

export function AvatarClassSelector({
  gender,
  onClassChange,
  onGenderChange,
  selectedClassId
}: AvatarClassSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedClass = avatarClassOptions.find((option) => option.id === selectedClassId);

  return (
    <View className="flex-row items-start gap-3 mt-10">
      <View className="w-32 gap-2">
        <Text className="text-xs font-black text-content-muted">Avatar preview</Text>
        <View className="h-32 items-center justify-center rounded-card border border-line-reward bg-primary-soft p-2">
          <Image
            key={`${selectedClassId}-${gender}`}
            source={getAvatarImage(selectedClassId, gender)}
            resizeMode="contain"
            style={avatarPreviewStyle}
            accessibilityLabel={`${gender} ${selectedClass?.label ?? "Warrior"} avatar preview`}
          />
        </View>
      </View>

      <View className="flex-1 gap-2">
        <Text className="text-xs font-black text-content-muted">Class</Text>
        <Pressable
          className="h-12 flex-row items-center rounded-card border border-line-blue bg-surface-card px-3"
          accessibilityLabel={`Selected class: ${selectedClass?.label ?? "Warrior"}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          onPress={() => setIsOpen((current) => !current)}
        >
          <Ionicons name={selectedClass?.icon ?? "shield"} size={20} color={colors.blueDark} />
          <Text className="ml-2 flex-1 text-sm font-black text-content" numberOfLines={1}>
            {selectedClass?.label ?? "Warrior"}
          </Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.muted}
          />
        </Pressable>

        {isOpen ? (
          <View
            className="overflow-hidden rounded-card border border-line-blue bg-surface-card"
            style={shadows.card}
          >
            {avatarClassOptions.map((option, index) => {
              const isSelected = option.id === selectedClassId;
              return (
                <Pressable
                  key={option.id}
                  className={`h-10 flex-row items-center px-3 ${
                    index > 0 ? "border-t border-line" : ""
                  } ${isSelected ? "bg-primary-soft" : "bg-surface-card"}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => {
                    onClassChange(option.id);
                    setIsOpen(false);
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? colors.blueDark : colors.muted}
                  />
                  <Text
                    className={`ml-2 flex-1 text-xs font-bold ${
                      isSelected ? "text-primary-strong" : "text-content"
                    }`}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={18} color={colors.blueDark} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Text className="mt-1 text-xs font-black text-content-muted">Gender</Text>
        <View
          className="flex-row overflow-hidden rounded-card border border-line-blue bg-surface-card"
          accessibilityRole="radiogroup"
        >
          {genderOptions.map((option, index) => {
            const isSelected = option.id === gender;
            const label = option.id === "male" ? "Male" : "Female";
            return (
              <Pressable
                key={option.id}
                className={`h-11 flex-1 items-center justify-center ${
                  index > 0 ? "border-l border-line-blue" : ""
                } ${isSelected ? "bg-primary" : "bg-surface-card"}`}
                accessibilityLabel={`${label} avatar`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => onGenderChange(option.id)}
              >
                <Ionicons
                  name={option.icon}
                  size={23}
                  color={isSelected ? "white" : colors.blueDark}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
