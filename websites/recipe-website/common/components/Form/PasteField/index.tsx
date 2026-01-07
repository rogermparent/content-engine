import clsx from "clsx";
import { Button } from "component-library/components/Button";
import { baseInputStyle } from "component-library/components/Form";
import { useRef } from "react";

interface PasteFieldProps<T> {
  itemName: string;
  pasteAreaId: string;
  parseFunction: (value: string) => T[];
  onImport: (values: T[]) => void;
}

export function PasteField<T>({
  itemName,
  pasteAreaId,
  parseFunction,
  onImport,
}: PasteFieldProps<T>) {
  const importTextareaRef = useRef<HTMLTextAreaElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleReplaceAll = () => {
    const textarea = importTextareaRef.current;
    const findInput = findInputRef.current;
    const replaceInput = replaceInputRef.current;

    if (!textarea || !findInput || !findInput.value) return;

    const searchText = findInput.value;
    const replaceText = replaceInput?.value || "";

    // Case-insensitive global replace
    const regex = new RegExp(escapeRegExp(searchText), "gi");
    textarea.value = textarea.value.replace(regex, replaceText);
  };

  const handleImport = () => {
    const value = importTextareaRef.current?.value;
    const values = value ? parseFunction(value) : [];
    onImport(values);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef}>
      <summary>Paste {itemName}</summary>
      <textarea
        title={`${itemName} Paste Area`}
        id={pasteAreaId}
        ref={importTextareaRef}
        className={clsx(baseInputStyle, "w-full h-36")}
      />
      <div className="my-1 flex flex-row flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          <span className="text-sm text-slate-300">Find:</span>
          <input
            ref={findInputRef}
            type="text"
            title="Find text"
            className={clsx(baseInputStyle, "py-0.5 px-2 w-32 text-sm")}
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-sm text-slate-300">Replace with:</span>
          <input
            ref={replaceInputRef}
            type="text"
            title="Replace with"
            className={clsx(baseInputStyle, "py-0.5 px-2 w-32 text-sm")}
          />
        </label>
        <Button onClick={handleReplaceAll} className="text-sm py-0.5 px-2">
          Replace All
        </Button>
      </div>
      <div className="my-1 flex flex-row">
        <Button onClick={handleImport}>Import {itemName}</Button>
      </div>
    </details>
  );
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
