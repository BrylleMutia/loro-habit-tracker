import "react-native-url-polyfill/auto";

import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, processLock } from "@supabase/supabase-js";

import type { Database } from "../types/database.generated";

const SECURE_STORE_CHUNK_SIZE = 1800;
const FALLBACK_SUPABASE_URL = "https://placeholder.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "supabase-not-configured";

type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function getSecureKey(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getManifestKey(key: string) {
  return `${getSecureKey(key)}.manifest`;
}

function getChunkKey(key: string, index: number) {
  return `${getSecureKey(key)}.chunk.${index}`;
}

async function getStoredChunkCount(key: string) {
  const manifest = await SecureStore.getItemAsync(getManifestKey(key));

  if (!manifest) {
    return 0;
  }

  try {
    const parsed = JSON.parse(manifest) as { chunks?: unknown };
    return typeof parsed.chunks === "number" && parsed.chunks >= 0 ? parsed.chunks : 0;
  } catch {
    return 0;
  }
}

const secureStoreAdapter: AuthStorage = {
  async getItem(key) {
    const chunkCount = await getStoredChunkCount(key);

    if (chunkCount === 0) {
      return SecureStore.getItemAsync(getSecureKey(key));
    }

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(getChunkKey(key, index))
      )
    );

    return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join("") : null;
  },
  async setItem(key, value) {
    const previousChunkCount = await getStoredChunkCount(key);
    const chunks = Array.from(
      { length: Math.ceil(value.length / SECURE_STORE_CHUNK_SIZE) },
      (_, index) =>
        value.slice(index * SECURE_STORE_CHUNK_SIZE, (index + 1) * SECURE_STORE_CHUNK_SIZE)
    );

    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(getChunkKey(key, index), chunk))
    );
    await SecureStore.setItemAsync(getManifestKey(key), JSON.stringify({ chunks: chunks.length }));
    await SecureStore.deleteItemAsync(getSecureKey(key));

    await Promise.all(
      Array.from(
        { length: Math.max(0, previousChunkCount - chunks.length) },
        (_, index) => SecureStore.deleteItemAsync(getChunkKey(key, chunks.length + index))
      )
    );
  },
  async removeItem(key) {
    const chunkCount = await getStoredChunkCount(key);
    await Promise.all([
      SecureStore.deleteItemAsync(getSecureKey(key)),
      SecureStore.deleteItemAsync(getManifestKey(key)),
      ...Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(getChunkKey(key, index))
      )
    ]);
  }
};

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const configuredPublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(configuredUrl && configuredPublishableKey);

export const supabase = createClient<Database>(
  configuredUrl || FALLBACK_SUPABASE_URL,
  configuredPublishableKey || FALLBACK_PUBLISHABLE_KEY,
  {
    auth: {
      ...(Platform.OS === "web" ? {} : { storage: secureStoreAdapter }),
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
      persistSession: true
    }
  }
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (nextState) => {
    if (nextState === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
