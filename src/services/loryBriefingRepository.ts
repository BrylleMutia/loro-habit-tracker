import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type {
  LoryBriefingContext,
  LoryBriefingResponse
} from "../types/loryBriefing";
import {
  getLoryBriefingCharacterCount,
  LORY_MAX_MESSAGE_LENGTH
} from "../types/loryBriefing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResponse(value: unknown): value is LoryBriefingResponse {
  return (
    isRecord(value) &&
    typeof value.dateKey === "string" &&
    (value.message === null || typeof value.message === "string") &&
    typeof value.promptVersion === "string" &&
    typeof value.contextVersion === "string" &&
    (value.generatedAt === null || typeof value.generatedAt === "string") &&
    typeof value.refreshCount === "number" &&
    Number.isInteger(value.refreshCount) &&
    value.refreshCount >= 0 &&
    value.refreshCount <= 2 &&
    (value.source === "cached" ||
      value.source === "generated" ||
      value.source === "pending" ||
      value.source === "limit" ||
      value.source === "failed")
  );
}

export async function requestLoryBriefing(
  context: LoryBriefingContext,
  forceRefresh = false
) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.functions.invoke("generate-lory-briefing", {
    body: { context, forceRefresh }
  });
  if (error) throw error;
  if (!isResponse(data)) throw new Error("The briefing response was invalid.");
  if (
    data.message !== null &&
    (data.message.trim().length === 0 ||
      getLoryBriefingCharacterCount(data.message) > LORY_MAX_MESSAGE_LENGTH)
  ) {
    throw new Error("The briefing response was too long.");
  }

  return data;
}
