import { useSyncExternalStore } from "react";

function getTimezone() {
  return typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined;
}

function subscribe() {
  return () => {};
}

export function useCurrentTimezone() {
  return useSyncExternalStore(subscribe, getTimezone, () => undefined);
}
