"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode } from "lexical";
import { $createVideoTimeNode } from "./nodes";

/**
 * `@` + clock time, at a word start, with a boundary after — so `@5:07`
 * becomes a chip when the author types the following space/punctuation, while
 * `foo@5:07` and a still-being-typed `@5:0` are left alone.
 */
const AT_TIME_REGEX = /(^|[\s(])@(\d{1,3}:[0-5]\d(?::[0-5]\d)?)(?=[\s.,!?)])/;

/**
 * Converts typed `@MM:SS` / `@H:MM:SS` runs into VideoTimeNodes (label-only,
 * time derived). A markdown TextMatchTransformer can't express this — its
 * `trigger` is the single just-typed character, a digit here — so this mirrors
 * Lexical's AutoLink approach: a node transform that watches plain TextNodes.
 */
export function VideoTimeAutoConvertPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (node) => {
      if (!node.isSimpleText() || node.getFormat() !== 0) return;
      const text = node.getTextContent();
      if (text.indexOf("@") === -1) return;
      const match = AT_TIME_REGEX.exec(text);
      if (match === null) return;

      // Offsets of the `@5:07` run itself (past the leading boundary char).
      const start = match.index + match[1].length;
      const end = start + 1 + match[2].length;
      const target =
        start === 0 ? node.splitText(end)[0] : node.splitText(start, end)[1];
      target.replace($createVideoTimeNode(null, match[2]));
    });
  }, [editor]);

  return null;
}
