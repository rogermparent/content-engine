import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type TextMatchTransformer,
  type Transformer,
} from "@lexical/markdown";
import { type TextNode } from "lexical";
import type { ComponentType } from "react";
import { parseTimeLabel } from "@discontent/component-library/lib/videoTime";
import {
  $createMultiplyableNode,
  $createVideoTimeNode,
  $isMultiplyableNode,
  $isVideoTimeNode,
  MultiplyableNode,
  VideoTimeNode,
} from "./nodes";
import { VideoTimeAutoConvertPlugin } from "./videoTimeAutoConvertPlugin";

/** `<Multiplyable baseNumber="2" />` <-> MultiplyableNode */
const MULTIPLYABLE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MultiplyableNode],
  export: (node) => {
    if (!$isMultiplyableNode(node)) return null;
    return `<Multiplyable baseNumber="${node.getBaseNumber()}" />`;
  },
  importRegExp: /<Multiplyable baseNumber="([^"]*)"\s*\/>/,
  regExp: /<Multiplyable baseNumber="([^"]*)"\s*\/>$/,
  replace: (textNode: TextNode, match: RegExpMatchArray) => {
    textNode.replace($createMultiplyableNode(match[1]));
  },
  trigger: ">",
  type: "text-match",
};

/**
 * `<VideoTime>3:37</VideoTime>` (label-derived) or
 * `<VideoTime time={217}>label</VideoTime>` (explicit) <-> VideoTimeNode.
 *
 * Import accepts every historical shape: `time={217}`, fractional
 * `time={29.5}`, legacy empty `time={}`, and the attr-less canonical form. An
 * explicit time equal to what the label already parses to is redundant, so it
 * normalizes to the derived (null) form on import.
 */
const VIDEO_TIME_TRANSFORMER: TextMatchTransformer = {
  dependencies: [VideoTimeNode],
  export: (node) => {
    if (!$isVideoTimeNode(node)) return null;
    const label = node.getLabel();
    const time = node.getTime();
    if (time === null) {
      if (parseTimeLabel(label) !== null) {
        return `<VideoTime>${label}</VideoTime>`;
      }
      // Degenerate: no explicit time and the label doesn't parse. Exporting
      // time={0} keeps the tag well-formed; the chip UI flags it for editing.
      return `<VideoTime time={0}>${label}</VideoTime>`;
    }
    return `<VideoTime time={${time}}>${label}</VideoTime>`;
  },
  importRegExp:
    /<VideoTime(?:\s+time=\{(\d*\.?\d*)\})?\s*>([^<]*)<\/VideoTime>/,
  regExp: /<VideoTime(?:\s+time=\{(\d*\.?\d*)\})?\s*>([^<]*)<\/VideoTime>$/,
  replace: (textNode: TextNode, match: RegExpMatchArray) => {
    const label = match[2];
    const explicit = match[1] ? Number(match[1]) : null;
    const time = explicit === parseTimeLabel(label) ? null : explicit;
    textNode.replace($createVideoTimeNode(time, label));
  },
  trigger: ">",
  type: "text-match",
};

/**
 * Default markdown transformers plus the recipe-specific custom tags. Custom
 * ones go first so they match before generic inline rules.
 */
export const RECIPE_TRANSFORMERS: Transformer[] = [
  MULTIPLYABLE_TRANSFORMER,
  VIDEO_TIME_TRANSFORMER,
  ...TRANSFORMERS,
];

export const RECIPE_EDITOR_NODES = [MultiplyableNode, VideoTimeNode];

/** Parse a markdown string into the current editor (call inside editor.update). */
export function $importMarkdown(
  markdown: string,
  transformers: Transformer[],
): void {
  $convertFromMarkdownString(markdown, transformers);
}

/** Serialize the current editor to a markdown string (call inside read/update). */
export function $exportMarkdown(transformers: Transformer[]): string {
  return $convertToMarkdownString(transformers);
}

/**
 * A markdown *dialect*: the Lexical namespace, the extra nodes, and the
 * transformers that together decide what syntax the editor understands.
 *
 * This exists so `LexicalMarkdownInput` is not hard-wired to one content type.
 * It used to import RECIPE_TRANSFORMERS/RECIPE_EDITOR_NODES directly and run
 * under the namespace "recipe-markdown", which meant any other site adopting the
 * editor silently inherited recipe's `<Multiplyable>` and `<VideoTime>` syntax.
 */
export interface MarkdownDialect {
  /** Lexical namespace — distinct per dialect so editors never share state. */
  namespace: string;
  /** Extra nodes beyond the rich-text/list/code/link baseline. */
  nodes: typeof RECIPE_EDITOR_NODES;
  transformers: Transformer[];
  /**
   * Extra editor plugins the dialect needs (rendered inside the composer),
   * e.g. recipe's `@NN:NN` auto-convert. Plain components taking no props.
   */
  plugins?: ComponentType[];
}

/** Plain CommonMark-ish markdown. The default: no site-specific syntax. */
export const PLAIN_MARKDOWN: MarkdownDialect = {
  namespace: "markdown",
  nodes: [],
  transformers: TRANSFORMERS,
};

/** Recipe's dialect — adds scalable quantities and video timestamps. */
export const RECIPE_MARKDOWN: MarkdownDialect = {
  namespace: "recipe-markdown",
  nodes: RECIPE_EDITOR_NODES,
  transformers: RECIPE_TRANSFORMERS,
  // Lives in its own file (not plugins.tsx) because plugins.tsx imports this
  // module — importing it back here would create a cycle.
  plugins: [VideoTimeAutoConvertPlugin],
};
