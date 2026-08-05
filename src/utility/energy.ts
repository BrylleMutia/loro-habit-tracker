import type { EnergyState } from "../types/app";

export const ENERGY_REFILL_INTERVAL_MS = 30 * 60 * 1000;

export function getEffectiveEnergyCurrent(
  energy: EnergyState,
  nowMs = Date.now()
) {
  if (energy.current >= energy.max || !energy.lastRefillAt) return energy.current;

  const elapsed = nowMs - Date.parse(energy.lastRefillAt);
  if (elapsed <= 0) return energy.current;

  return Math.min(
    energy.max,
    energy.current + Math.floor(elapsed / ENERGY_REFILL_INTERVAL_MS)
  );
}

export function getEnergyRefillMinutesRemaining(energy: EnergyState, nowMs = Date.now()) {
  if (energy.current >= energy.max || !energy.lastRefillAt) return null;

  const elapsed = Math.max(0, nowMs - Date.parse(energy.lastRefillAt));
  const effectiveCurrent = getEffectiveEnergyCurrent(energy, nowMs);
  if (effectiveCurrent >= energy.max) return null;

  const remaining = ENERGY_REFILL_INTERVAL_MS - (elapsed % ENERGY_REFILL_INTERVAL_MS);
  return Math.max(1, Math.ceil(remaining / 60_000));
}

export function applyPassiveEnergyRefill(
  energy: EnergyState,
  now = new Date()
): EnergyState {
  const nowMs = now.getTime();
  const effectiveCurrent = getEffectiveEnergyCurrent(energy, nowMs);
  if (effectiveCurrent === energy.current) return energy;

  const elapsed = Math.max(0, nowMs - Date.parse(energy.lastRefillAt ?? now.toISOString()));
  const pointsGained = Math.max(
    0,
    Math.floor(elapsed / ENERGY_REFILL_INTERVAL_MS)
  );
  const parsedLastRefillAt = Date.parse(energy.lastRefillAt ?? now.toISOString());
  const nextRefillAt =
    effectiveCurrent >= energy.max
      ? now.toISOString()
      : new Date(
          parsedLastRefillAt + pointsGained * ENERGY_REFILL_INTERVAL_MS
        ).toISOString();

  return {
    ...energy,
    current: effectiveCurrent,
    lastRefillAt: nextRefillAt
  };
}
