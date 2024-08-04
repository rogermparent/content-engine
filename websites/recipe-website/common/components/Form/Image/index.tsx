"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FileInput } from "component-library/components/Form/inputs/File";
import { CheckboxInput } from "component-library/components/Form/inputs/Checkbox";
import { StaticImageProps } from "next-static-image/src";

export function ImageInput({
  defaultImage,
  errors,
  imageToImport,
}: {
  defaultImage?: StaticImageProps;
  errors: string[] | undefined;
  imageToImport?: string;
}) {
  const [imagePreviewURL, setImagePreviewURL] = useState<string>();

  useEffect(() => {
    if (imagePreviewURL) {
      return () => {
        URL.revokeObjectURL(imagePreviewURL);
      };
    }
  }, [imagePreviewURL]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <FileInput
        label="Image"
        name="image"
        id="recipe-form-image"
        errors={errors}
        ref={fileInputRef}
        onChange={(e) => {
          const imagesToUpload = e.target?.files;
          if (!imagesToUpload) {
            return;
          }
          const previewImage = imagesToUpload[0];
          if (!previewImage) {
            return;
          }
          const previewURL = URL.createObjectURL(previewImage);
          setImagePreviewURL(previewURL);
        }}
      />
      <div className="w-full">
        {imagePreviewURL ? (
          <div>
            <Image
              src={imagePreviewURL}
              alt="Image to upload"
              className="w-full"
              width={850}
              height={475}
              unoptimized={true}
            >
              {null}
            </Image>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                  setImagePreviewURL(undefined);
                }
              }}
            >
              Cancel upload
            </button>
          </div>
        ) : imageToImport ? (
          <div>
            <div>Importing image:</div>
            <Image
              src={imageToImport}
              unoptimized={true}
              alt="Direct link to image which will be imported."
              width={850}
              height={475}
            >
              {null}
            </Image>
            <input type="hidden" value={imageToImport} name="imageImportUrl" />
          </div>
        ) : defaultImage ? (
          <Image
            {...defaultImage.props}
            alt="Existing Recipe Image"
            unoptimized={true}
          >
            {null}
          </Image>
        ) : null}
      </div>
      {defaultImage ? (
        <CheckboxInput name="clearImage" label="Remove Image" />
      ) : null}
    </div>
  );
}
