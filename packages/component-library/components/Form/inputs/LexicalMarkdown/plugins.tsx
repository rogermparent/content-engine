"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $exportRecipeMarkdown } from "./transformers";

/**
 * Serializes the editor to markdown on every edit and reports it upward.
 * Skips the initial population update so loading content doesn't count as a
 * user edit (which would fight a controlled value).
 */
export function EditorOnChange({
  onMarkdownChange,
}: {
  onMarkdownChange: (markdown: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const firstUpdate = useRef(true);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (firstUpdate.current) {
        firstUpdate.current = false;
        return;
      }
      editorState.read(() => {
        onMarkdownChange($exportRecipeMarkdown());
      });
    });
  }, [editor, onMarkdownChange]);

  return null;
}
