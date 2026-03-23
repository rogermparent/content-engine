"use client";

import { Button } from "@discontent/component-library/components/Button";
import { FileInput } from "@discontent/component-library/components/Form/inputs/File";
import { ImageInput } from "@discontent/component-library/components/Form/inputs/Image";
import {
  ListItemProps,
  useKeyList,
} from "@discontent/component-library/components/Form/inputs/List";
import { TextInput } from "@discontent/component-library/components/Form/inputs/Text";

export interface HomepageUploadInputItem {
  file?: File;
  name?: string;
}

function HomepageUploadInput({
  name,
  defaultValue,
}: ListItemProps<HomepageUploadInputItem>) {
  return (
    <div>
      <input
        type="hidden"
        name={`${name}.originalName`}
        value={defaultValue?.name}
      />
      <TextInput
        name={`${name}.name`}
        label="Name"
        defaultValue={defaultValue?.name}
      />
      <ImageInput
        name={`${name}.file`}
        clearImageName={`${name}.deleteFile`}
        label="File"
        defaultImage={defaultValue?.name ? `/uploads/${defaultValue.name}` : ""}
      />
      <FileInput name={`${name}.file`} label="File" defaultValue="" />
    </div>
  );
}

const inputListControlButtonStyle = "ml-0.5 w-10 h-10 sm:w-8 sm:h-8";

export function UploadsListInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: HomepageUploadInputItem[];
}) {
  const [{ values }, dispatch] =
    useKeyList<HomepageUploadInputItem>(defaultValue);

  return (
    <details>
      <summary className="font-bold p-1">Uploads</summary>
      <ul>
        {values.map(({ key, defaultValue }, index) => {
          const itemName = `${name}[${index}]`;
          return (
            <li key={key}>
              <div className="border-l-2 border-white pl-2 my-2">
                <HomepageUploadInput
                  name={itemName}
                  defaultValue={defaultValue}
                />
                <div className="flex flex-row flex-nowrap justify-center">
                  <Button
                    className={inputListControlButtonStyle}
                    onClick={() => {
                      dispatch({ type: "DELETE", index });
                    }}
                  >
                    &times;
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={() => {
          dispatch({ type: "APPEND" });
        }}
      >
        Append
      </Button>
    </details>
  );
}
