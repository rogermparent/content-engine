"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $exportRecipeMarkdown } from "./transformers";

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
