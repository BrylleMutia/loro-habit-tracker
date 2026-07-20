import { images } from "./images";
import type { AvatarClassId, AvatarVariant, IconName } from "../types/app";

export type AvatarGender = "male" | "female";

export type AvatarClassOption = {
  id: AvatarClassId;
  label: string;
  icon: IconName;
};

export const avatarClassOptions: AvatarClassOption[] = [
  { id: "warrior", label: "Warrior", icon: "shield" },
  { id: "ranger", label: "Ranger", icon: "navigate" },
  { id: "mercenary", label: "Mercenary", icon: "flash" },
  { id: "druid", label: "Druid", icon: "leaf" },
  { id: "wizard", label: "Wizard", icon: "sparkles" }
];

const genderVariants: Record<AvatarClassId, Record<AvatarGender, AvatarVariant>> = {
  druid: { female: "default", male: "alternate" },
  mercenary: { female: "alternate", male: "default" },
  ranger: { female: "default", male: "alternate" },
  warrior: { female: "alternate", male: "default" },
  wizard: { female: "alternate", male: "default" }
};

export function getAvatarVariant(classId: AvatarClassId, gender: AvatarGender) {
  return genderVariants[classId][gender];
}

export function getAvatarImage(classId: AvatarClassId, gender: AvatarGender) {
  return getAvatarVariant(classId, gender) === "alternate"
    ? images.classAvatarAlternates[classId]
    : images.classAvatars[classId];
}
