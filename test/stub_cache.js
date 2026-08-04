/**
 * `next/cache` under vitest.
 *
 * `revalidateTag` records rather than no-ops, because the item kind (§2's
 * fifth) has no engine return value to assert on — the fired tag list *is* the
 * trigger, so a test can only see it here.
 */
export const revalidatedTags = [];

export function revalidatePath() {
  return null;
}

export function revalidateTag(tag, profile) {
  revalidatedTags.push({ tag, profile });
  return null;
}

/** Clear between tests. */
export function resetRevalidatedTags() {
  revalidatedTags.length = 0;
}
