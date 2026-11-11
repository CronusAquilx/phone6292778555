export const CURRENT_CHANGELOG_VERSION = "2026-11-11b";

const storageKey = (version: string) => `birch-changelog-seen:${version}`;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

/** Local storage is device-scoped; a new version can be announced once again. */
export function shouldShowChangelog(
  storage: ReadableStorage,
  version = CURRENT_CHANGELOG_VERSION,
): boolean {
  try {
    return storage.getItem(storageKey(version)) !== "seen";
  } catch {
    // Never trap a visitor behind a notice when device storage is unavailable.
    return false;
  }
}

export function markChangelogSeen(
  storage: WritableStorage,
  version = CURRENT_CHANGELOG_VERSION,
): void {
  try {
    storage.setItem(storageKey(version), "seen");
  } catch {
    // Dismissal still works for this document when storage is blocked.
  }
}

export function bypassesChangelog(pathname: string): boolean {
  return pathname === "/play" || pathname === "/guest-play" || pathname.startsWith("/scramjet/");
}
