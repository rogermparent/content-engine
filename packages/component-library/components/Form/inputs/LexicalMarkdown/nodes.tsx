import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { JSX } from "react";
import { parseTimeLabel } from "@discontent/component-library/lib/videoTime";

/**
 * Inline decorator node for `<Multiplyable baseNumber="X" />`. The recipe view
 * scales the number by the active multiplier; in the editor it shows the base
 * number so authors see what they typed. Round-trips to/from the markdown tag
 * via the transformers in ./transformers.
 */
export type SerializedMultiplyableNode = Spread<
  { baseNumber: string },
  SerializedLexicalNode
>;

export class MultiplyableNode extends DecoratorNode<JSX.Element> {
  __baseNumber: string;

  static getType(): string {
    return "multiplyable";
  }

  static clone(node: MultiplyableNode): MultiplyableNode {
    return new MultiplyableNode(node.__baseNumber, node.__key);
  }

  constructor(baseNumber: string, key?: NodeKey) {
    super(key);
    this.__baseNumber = baseNumber;
  }

  getBaseNumber(): string {
    return this.__baseNumber;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    // Mark the exported span so importDOM can round-trip an HTML copy-paste
    // back into a MultiplyableNode (mirrors the decorate() marker attribute).
    element.setAttribute("data-lexical-multiplyable", this.__baseNumber);
    element.textContent = this.__baseNumber;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-multiplyable")) return null;
        return {
          conversion: (element: HTMLElement): DOMConversionOutput => {
            const baseNumber =
              element.getAttribute("data-lexical-multiplyable") ??
              element.textContent ??
              "";
            return { node: $createMultiplyableNode(baseNumber) };
          },
          priority: 1,
        };
      },
    };
  }

  static importJSON(serialized: SerializedMultiplyableNode): MultiplyableNode {
    return $createMultiplyableNode(serialized.baseNumber);
  }

  exportJSON(): SerializedMultiplyableNode {
    return {
      ...super.exportJSON(),
      type: "multiplyable",
      version: 1,
      baseNumber: this.__baseNumber,
    };
  }

  getTextContent(): string {
    return this.__baseNumber;
  }

  decorate(_editor: unknown, _config: EditorConfig): JSX.Element {
    return (
      <span
        data-lexical-multiplyable={this.__baseNumber}
        className="rounded-xs bg-secondary px-1 text-secondary-foreground"
        title={`Multiplyable: ${this.__baseNumber}`}
      >
        {this.__baseNumber}
      </span>
    );
  }
}

export function $createMultiplyableNode(baseNumber: string): MultiplyableNode {
  return $applyNodeReplacement(new MultiplyableNode(baseNumber));
}

export function $isMultiplyableNode(
  node: LexicalNode | null | undefined,
): node is MultiplyableNode {
  return node instanceof MultiplyableNode;
}

/**
 * Inline decorator node for video timestamps. The label is the source of
 * truth: `__time === null` means the seconds are derived from the label via
 * parseTimeLabel (`<VideoTime>3:37</VideoTime>`). A non-null `__time` is an
 * explicit override, needed only when the label isn't itself a time
 * (`<VideoTime time={217}>jars in the video</VideoTime>`).
 */
export type SerializedVideoTimeNode = Spread<
  { time: number | null; label: string },
  SerializedLexicalNode
>;

export class VideoTimeNode extends DecoratorNode<JSX.Element> {
  __time: number | null;
  __label: string;
  /**
   * Transient UI hint: the toolbar sets it when inserting a node whose time
   * can't be derived, so the chip opens its edit popover immediately. Copied
   * by clone() (Lexical clones on every write) but never serialized.
   */
  __autoEdit: boolean;

  static getType(): string {
    return "video-time";
  }

  static clone(node: VideoTimeNode): VideoTimeNode {
    const clone = new VideoTimeNode(node.__time, node.__label, node.__key);
    clone.__autoEdit = node.__autoEdit;
    return clone;
  }

  constructor(time: number | null, label: string, key?: NodeKey) {
    super(key);
    this.__time = time;
    this.__label = label;
    this.__autoEdit = false;
  }

  getTime(): number | null {
    return this.__time;
  }

  getLabel(): string {
    return this.__label;
  }

  /** Seconds this timestamp seeks to: explicit override, else parsed label. */
  getEffectiveTime(): number | null {
    return this.__time ?? parseTimeLabel(this.__label);
  }

  setLabel(label: string): void {
    this.getWritable().__label = label;
  }

  setTime(time: number | null): void {
    this.getWritable().__time = time;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serialized: SerializedVideoTimeNode): VideoTimeNode {
    // v1 always carried a number; v2 allows null (= derived from label).
    return $createVideoTimeNode(serialized.time ?? null, serialized.label);
  }

  exportJSON(): SerializedVideoTimeNode {
    return {
      ...super.exportJSON(),
      type: "video-time",
      version: 2,
      time: this.__time,
      label: this.__label,
    };
  }

  getTextContent(): string {
    return this.__label;
  }

  decorate(): JSX.Element {
    const effective = this.getEffectiveTime();
    return (
      <span
        data-lexical-video-time={effective ?? ""}
        className="underline decoration-dotted"
        title={
          effective === null
            ? "Video time: no time set"
            : `Video time: ${effective}s`
        }
      >
        {this.__label}
      </span>
    );
  }
}

export function $createVideoTimeNode(
  time: number | null,
  label: string,
): VideoTimeNode {
  return $applyNodeReplacement(new VideoTimeNode(time, label));
}

export function $isVideoTimeNode(
  node: LexicalNode | null | undefined,
): node is VideoTimeNode {
  return node instanceof VideoTimeNode;
}
