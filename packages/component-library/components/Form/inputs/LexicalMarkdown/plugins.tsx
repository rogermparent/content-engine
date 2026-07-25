"use client";

import { useEffect, type RefObject } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import { $exportRecipeMarkdown } from "./transformers";

/**
 * Publishes the live editor instance to a ref owned by the parent, so the
 * mode toggle can synchronously serialize the current content to markdown
 * before switching to Source mode — without waiting for the async update
 * listener to have propagated a just-inserted node (e.g. a Multiplyable).
 */
export function CaptureEditor({
  editorRef,
}: {
  editorRef: RefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
}

/**
 * Serializes the editor to markdown on edit and reports it upward. Gated by
 * `shouldPropagate` so Lexical's load-time reconciliation doesn't rewrite
 * (normalise) untouched content the moment the editor mounts — only genuine
 * user edits update the markdown.
 */
export function EditorOnChange({
  onMarkdownChange,
  shouldPropagate,
}: {
  onMarkdownChange: (markdown: string) => void;
  shouldPropagate: () => boolean;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (!shouldPropagate()) return;
      editorState.read(() => {
        onMarkdownChange($exportRecipeMarkdown());
      });
    });
  }, [editor, onMarkdownChange, shouldPropagate]);

  return null;
}
