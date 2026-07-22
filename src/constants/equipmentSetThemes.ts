import type { ImageSourcePropType } from "react-native";

import type { IconName } from "../types/app";
import { colors } from "./colors";
import { images } from "./images";
import {
  emberforgeVanguardSet,
  tidesongArcanistSet,
  verdantWayfinderSet
} from "./equipment";

export type EquipmentSetTheme = {
  id: string;
  label: string;
  crestIcon: IconName;
  profileFrame: ImageSourcePropType;
  colors: {
    accent: string;
    accentStrong: string;
    accentSoft: string;
    border: string;
    surface: string;
  };
};

export const equipmentSetThemes: Record<string, EquipmentSetTheme> = {
  [verdantWayfinderSet.id]: {
    id: verdantWayfinderSet.id,
    label: "Verdant",
    crestIcon: "compass",
    profileFrame: images.profileFrames.verdantWayfinder,
    colors: colors.equipmentSets.verdantWayfinder
  },
  [emberforgeVanguardSet.id]: {
    id: emberforgeVanguardSet.id,
    label: "Emberforge",
    crestIcon: "hammer",
    profileFrame: images.profileFrames.emberforgeVanguard,
    colors: colors.equipmentSets.emberforgeVanguard
  },
  [tidesongArcanistSet.id]: {
    id: tidesongArcanistSet.id,
    label: "Tidesong",
    crestIcon: "moon",
    profileFrame: images.profileFrames.tidesongArcanist,
    colors: colors.equipmentSets.tidesongArcanist
  }
};

export function getEquipmentSetTheme(setId: string | null | undefined) {
  return setId ? equipmentSetThemes[setId] ?? null : null;
}
