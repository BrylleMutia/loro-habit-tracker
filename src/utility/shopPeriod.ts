import type { DateKey } from "../types/app";

function toUtcDate(dateKey: DateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: DateKey, days: number) {
  const date = toUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function getShopPeriodKey(dateKey: DateKey) {
  const date = toUtcDate(dateKey);
  return shiftDateKey(dateKey, -date.getUTCDay());
}

export function getShopPeriodEndDateKey(dateKey: DateKey) {
  return shiftDateKey(getShopPeriodKey(dateKey), 7);
}
