"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FileInput } from "../File";
import { StaticImageProps } from "@discontent/next-static-image/src";
import { CheckboxInput } from "../Checkbox";

export function ImageInput({
  defaultImage,
  errors,
  label,
  name,
  id,
  clearImageName = "clearImage",
}: {
  defaultImage?: StaticImageProps | string;
  errors?: string[] | undefined;
  imageToImport?: string;
  label: string;
  name: string;
  clearImageName?: string;
  id?: string;
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
        label={label}
        name={name}
        id={id}
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
        ) : defaultImage ? (
          typeof defaultImage === "string" ? (
            <Image
              src={defaultImage}
              alt="Existing Image"
              width={500}
              height={500}
            >
              {null}
            </Image>
          ) : (
            <Image
              {...defaultImage.props}
              alt="Existing Image"
              unoptimized={true}
            >
              {null}
            </Image>
          )
        ) : null}
      </div>
      {defaultImage ? (
        <CheckboxInput name={clearImageName} label="Remove Image" />
      ) : null}
    </div>
  );
}
