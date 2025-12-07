import {
  DefaultControls,
  FormatButton,
  MarkdownControlsProps,
  wrapSelection,
} from "component-library/components/Form/inputs/Markdown/common";

export function MultiplyableControl({ textArea }: MarkdownControlsProps) {
  const handleMultiplyableClick = () => {
    wrapSelection({
      prefix: `<Multiplyable baseNumber="`,
      suffix: `" />`,
      textArea,
    });
  };

  return (
    <FormatButton onClick={handleMultiplyableClick}>
      <span>&times;</span>
    </FormatButton>
  );
}

export function VideoTimeControl({ textArea }: MarkdownControlsProps) {
  const handleVideoTimeClick = () => {
    wrapSelection({
      prefix: `<VideoTime time={}>`,
      suffix: `</VideoTime>`,
      textArea,
    });
  };

  return (
    <FormatButton onClick={handleVideoTimeClick}>
      <span className="text-xs">&#9202;</span>
    </FormatButton>
  );
}

export function YieldControls({ textArea }: MarkdownControlsProps) {
  return (
    <>
      <MultiplyableControl textArea={textArea} />
    </>
  );
}

export function RecipeCustomControls({ textArea }: MarkdownControlsProps) {
  return (
    <>
      <VideoTimeControl textArea={textArea} />
      <MultiplyableControl textArea={textArea} />
      <DefaultControls textArea={textArea} />
    </>
  );
}

export function DummyMultiplyable({
  baseNumber,
}: {
  baseNumber: string | number;
}) {
  return <>{baseNumber}</>;
}
