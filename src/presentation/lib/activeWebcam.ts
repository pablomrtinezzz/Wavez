import { useSyncExternalStore } from 'react';

/**
 * Only one webcam stream plays at a time across the whole page: opening a
 * player stops the previous one (each is a full video stream).
 */
let activeId: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActiveWebcam(): string | null {
  return activeId;
}

export function setActiveWebcam(id: string | null) {
  activeId = id;
  listeners.forEach((l) => l());
}

export function useActiveWebcam(): string | null {
  return useSyncExternalStore(subscribe, () => activeId, () => null);
}
