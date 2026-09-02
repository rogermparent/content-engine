import { describe, expect, it } from "vitest";

import { createHeadlessEditor } from "@lexical/headless";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import {
  RECIPE_MARKDOWN,
  $importMarkdown,
  $exportMarkdown,
} from "@discontent/component-library/components/Form/inputs/LexicalMarkdown/transformers";

/*
 * Every historical `<VideoTime>` shape in the content repo must import into
 * the editor and export back out per the label-first normalization rules:
 *
 * - attr-less `<VideoTime>3:37</VideoTime>` is canonical and round-trips;
 * - `time={N}` matching what the label parses to is redundant and drops;
 * - `time={N}` differing from the label is a deliberate override and stays;
 * - fractional `time={29.5}` (live in the kefir recipe) must not be dropped
 *   by an integer-only import regex — the original `\d+` bug left it as
 *   literal text in the editor;
 * - legacy empty `time={}` (old broken ingredients control) imports as a
 *   label-derived node rather than failing.
 */
function roundTrip(markdown: string): string {
  const editor = createHeadlessEditor({
    namespace: "test",
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
      ...RECIPE_MARKDOWN.nodes,
    ],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(() => $importMarkdown(markdown, RECIPE_MARKDOWN.transformers), {
    discrete: true,
  });
  return editor.read(() => $exportMarkdown(RECIPE_MARKDOWN.transformers));
}

describe("VideoTime markdown round-trips", () => {
  it("keeps the attr-less canonical form as-is", () => {
    expect(roundTrip("Boil it at <VideoTime>3:37</VideoTime> exactly.")).toBe(
      "Boil it at <VideoTime>3:37</VideoTime> exactly.",
    );
  });

  it("drops a redundant explicit time that matches the label", () => {
    expect(roundTrip("See <VideoTime time={217}>3:37</VideoTime>.")).toBe(
      "See <VideoTime>3:37</VideoTime>.",
    );
    expect(roundTrip("Wait <VideoTime time={10}>10s</VideoTime>.")).toBe(
      "Wait <VideoTime>10s</VideoTime>.",
    );
  });

  it("keeps an explicit time that differs from the label", () => {
    expect(
      roundTrip("The <VideoTime time={90}>jars in the video</VideoTime>."),
    ).toBe("The <VideoTime time={90}>jars in the video</VideoTime>.");
    // A parseable label with a *different* override is deliberate, too.
    expect(roundTrip("At <VideoTime time={200}>3:37</VideoTime>.")).toBe(
      "At <VideoTime time={200}>3:37</VideoTime>.",
    );
  });

  it("imports fractional times instead of leaving literal text", () => {
    expect(roundTrip("Stir at <VideoTime time={29.5}>0:29</VideoTime>.")).toBe(
      "Stir at <VideoTime time={29.5}>0:29</VideoTime>.",
    );
    expect(roundTrip("Stir at <VideoTime time={29.5}>29.5</VideoTime>.")).toBe(
      "Stir at <VideoTime>29.5</VideoTime>.",
    );
  });

  it("imports the legacy empty time={} as label-derived", () => {
    expect(roundTrip("Chill <VideoTime time={}>5:07</VideoTime>.")).toBe(
      "Chill <VideoTime>5:07</VideoTime>.",
    );
  });

  it("exports time={0} for the degenerate no-time prose label", () => {
    // No explicit time, label doesn't parse: keep the tag well-formed. The
    // chip UI flags this state for editing.
    expect(roundTrip("The <VideoTime time={}>jars</VideoTime>.")).toBe(
      "The <VideoTime time={0}>jars</VideoTime>.",
    );
  });

  it("still round-trips Multiplyable alongside VideoTime", () => {
    const line =
      'Add <Multiplyable baseNumber="2" /> cups at <VideoTime>5:07</VideoTime>.';
    expect(roundTrip(line)).toBe(line);
  });
});
