import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type TextMatchTransformer,
  type Transformer,
} from "@lexical/markdown";
import { type TextNode } from "lexical";
import {
  $createMultiplyableNode,
  $createVideoTimeNode,
  $isMultiplyableNode,
  $isVideoTimeNode,
  MultiplyableNode,
  VideoTimeNode,
} from "./nodes";

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

/** `<VideoTime time={10}>10s</VideoTime>` <-> VideoTimeNode */
const VIDEO_TIME_TRANSFORMER: TextMatchTransformer = {
  dependencies: [VideoTimeNode],
  export: (node) => {
    if (!$isVideoTimeNode(node)) return null;
    return `<VideoTime time={${node.getTime()}}>${node.getLabel()}</VideoTime>`;
  },
  importRegExp: /<VideoTime time=\{(\d+)\}>([^<]*)<\/VideoTime>/,
  regExp: /<VideoTime time=\{(\d+)\}>([^<]*)<\/VideoTime>$/,
  replace: (textNode: TextNode, match: RegExpMatchArray) => {
    textNode.replace($createVideoTimeNode(Number(match[1]), match[2]));
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

/** Parse a markdown string into the current editor (call inside editor.update). */
export function $importRecipeMarkdown(markdown: string): void {
  $convertFromMarkdownString(markdown, RECIPE_TRANSFORMERS);
}

/** Serialize the current editor to a markdown string (call inside read/update). */
export function $exportRecipeMarkdown(): string {
  return $convertToMarkdownString(RECIPE_TRANSFORMERS);
}

export const RECIPE_EDITOR_NODES = [MultiplyableNode, VideoTimeNode];
