import { randomUUID } from "crypto";

export function generateRoomId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function generateOptionId(): string {
  return randomUUID().slice(0, 8);
}

export function computePercentages(
  votes: Record<string, number>,
  total: number
): Record<string, number> {
  if (total === 0) {
    return Object.fromEntries(Object.keys(votes).map((k) => [k, 0]));
  }
  return Object.fromEntries(
    Object.entries(votes).map(([k, v]) => [k, Math.round((v / total) * 100)])
  );
}

export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}