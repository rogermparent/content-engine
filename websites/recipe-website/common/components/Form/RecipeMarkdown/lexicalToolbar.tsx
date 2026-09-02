"use client";

import { $getSelection, $isRangeSelection } from "lexical";
import {
  $createMultiplyableNode,
  $createVideoTimeNode,
} from "@discontent/component-library/components/Form/inputs/LexicalMarkdown/nodes";
import { parseTimeLabel } from "@discontent/component-library/lib/videoTime";
import type { LexicalToolbarItem } from "@discontent/component-library/components/Form/inputs/LexicalMarkdown/toolbar";

/**
 * Replaces the current selection with a <Multiplyable> node whose base number
 * is the selected text (matching the old toolbar's wrap-selection behaviour).
 */
const multiplyableItem: LexicalToolbarItem = {
  key: "multiplyable",
  // Avoid the substring "Multiply" so it doesn't collide with the recipe
  // view's "Multiply" multiplier input in getByLabel queries.
  title: "Scaling number",
  label: <span>&times;</span>,
  run: (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const text = selection.getTextContent();
      selection.insertNodes([$createMultiplyableNode(text)]);
    });
  },
};

/**
 * Replaces the current selection with a <VideoTime> node using the selected
 * text as the label. A selection that itself parses as a time ("3:37") is done
 * in one click; otherwise the chip's edit popover opens immediately so the
 * author can finish the timestamp in place.
 */
const videoTimeItem: LexicalToolbarItem = {
  key: "video-time",
  // Avoid the word "Video" so it doesn't collide with getByLabel("Video")
  // (the video upload field) in tests / accessibility queries.
  title: "Timestamp",
  label: <span className="text-xs">&#9202;</span>,
  run: (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const text = selection.getTextContent();
      const node = $createVideoTimeNode(null, text);
      if (parseTimeLabel(text) === null) node.setAutoEdit(true);
      selection.insertNodes([node]);
    });
  },
};

/** Toolbar items for the yield field (Multiplyable only). */
export const yieldToolbarItems: LexicalToolbarItem[] = [multiplyableItem];

/** Toolbar items for ingredient/instruction text (Multiplyable + VideoTime). */
export const recipeToolbarItems: LexicalToolbarItem[] = [
  videoTimeItem,
  multiplyableItem,
];
