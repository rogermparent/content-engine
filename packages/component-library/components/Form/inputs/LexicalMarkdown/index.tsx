"use client";

import { useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { Errors, FieldWrapper, baseInputStyle } from "../..";
import { cn } from "@discontent/component-library/lib/utils";
import {
  RECIPE_EDITOR_NODES,
  RECIPE_TRANSFORMERS,
  $importRecipeMarkdown,
} from "./transformers";
import { EditorOnChange } from "./plugins";
import { LexicalToolbar, type LexicalToolbarItem } from "./toolbar";

export interface LexicalMarkdownInputProps {
  name?: string;
  id?: string;
  label?: string;
  /** Uncontrolled initial markdown. */
  defaultValue?: string;
  /** Controlled markdown value (for TanStack Form). */
  value?: string;
  onChange?: (markdown: string) => void;
  errors?: string[];
  /** Extra toolbar items (e.g. Multiplyable, VideoTime). */
  toolbarItems?: LexicalToolbarItem[];
}

const editorTheme = {
  paragraph: "my-1",
  quote: "border-l-2 border-border pl-2 italic",
  list: { ul: "list-disc pl-5", ol: "list-decimal pl-5" },
  text: {
    bold: "font-bold",
    italic: "italic",
    code: "font-mono bg-muted px-1",
  },
  link: "underline text-cyan-300",
};

function ModeToggle({
  mode,
  onToggle,
}: {
  mode: "rich" | "source";
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={mode === "source"}
      className="ml-auto rounded-xs px-2 py-0.5 text-xs hover:bg-muted aria-[pressed=true]:bg-muted"
      onClick={onToggle}
    >
      {mode === "source" ? "Editor" : "Source"}
    </button>
  );
}

export function LexicalMarkdownInput({
  name,
  id = name,
  label,
  defaultValue,
  value,
  onChange,
  errors,
  toolbarItems,
}: LexicalMarkdownInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const markdown = controlled ? value : internal;
  const [mode, setMode] = useState<"rich" | "source">("rich");
  // Bumping this remounts the composer so it re-initialises from the current
  // markdown (used when toggling back from source mode).
  const [richKey, setRichKey] = useState(0);
  // Only serialize rich-mode edits back to markdown once the user actually
  // interacts; Lexical's load-time reconciliation would otherwise rewrite
  // (normalise) untouched content the moment the editor mounts.
  const interactedRef = useRef(false);
  const markInteracted = () => {
    interactedRef.current = true;
  };

  const setMarkdown = (next: string) => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  const toggleMode = () => {
    if (mode === "source") {
      // Re-mount the composer so it re-imports the (possibly edited) markdown.
      interactedRef.current = false;
      setRichKey((k) => k + 1);
      setMode("rich");
    } else {
      setMode("source");
    }
  };

  return (
    <FieldWrapper label={label} id={id}>
      <Errors errors={errors} />
      <div className="flex flex-col rounded-xs border">
        {mode === "source" ? (
          <>
            <div className="flex items-center justify-end border-b p-1">
              <ModeToggle mode={mode} onToggle={toggleMode} />
            </div>
            <textarea
              aria-label={label ? `${label} source` : "Markdown source"}
              className={cn(baseInputStyle, "h-40 w-full border-0 px-2 py-1")}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
            />
          </>
        ) : (
          <LexicalComposer
            key={richKey}
            initialConfig={{
              namespace: "recipe-markdown",
              theme: editorTheme,
              nodes: [
                HeadingNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                CodeNode,
                LinkNode,
                ...RECIPE_EDITOR_NODES,
              ],
              editorState: () => $importRecipeMarkdown(markdown),
              onError: (error) => {
                throw error;
              },
            }}
          >
            <div className="flex flex-wrap items-center gap-1 border-b p-1">
              <LexicalToolbar
                extraItems={toolbarItems}
                onInteract={markInteracted}
              />
              <ModeToggle mode={mode} onToggle={toggleMode} />
            </div>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-label={label || "Markdown editor"}
                  className="markdown-body min-h-40 px-2 py-1 outline-none"
                  onBeforeInput={markInteracted}
                  onPaste={markInteracted}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin transformers={RECIPE_TRANSFORMERS} />
            <EditorOnChange
              onMarkdownChange={setMarkdown}
              shouldPropagate={() => interactedRef.current}
            />
          </LexicalComposer>
        )}
      </div>
      {name && <input type="hidden" name={name} value={markdown} />}
    </FieldWrapper>
  );
}
