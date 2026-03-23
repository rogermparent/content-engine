import type { ContentFormState } from "recipe-website-common/controller/formState";
import type {
  ContentTypeConfig,
  UploadSpec,
} from "@discontent/cms/content/types";
import type { Key } from "lmdb";

export type ContentSuccessConfig = {
  itemBasePath: string;
  listPaths: Array<{ path: string; type?: "page" | "layout" }>;
  redirectTo?: (slug: string) => string;
};

export interface EditorContentConfig<
  TData,
  TIndexValue,
  TKey extends Key,
  TFormState extends ContentFormState,
  TParsed = Record<string, unknown>,
> {
  contentConfig: ContentTypeConfig<TData, TIndexValue, TKey>;
  successConfig: ContentSuccessConfig;

  parseFormData: (
    formData: FormData,
  ) =>
    | { success: true; parsed: TParsed }
    | { success: false; state: TFormState };

  buildCreateData: (
    parsed: TParsed,
    contentDirectory: string,
  ) => Promise<{ slug: string; data: TData }>;

  buildUpdateData: (
    parsed: TParsed,
    currentSlug: string,
    currentDate: number,
    contentDirectory: string,
  ) => Promise<{ slug: string; data: TData }>;

  buildCreateUploads?: (
    parsed: TParsed,
    contentDirectory: string,
  ) => Promise<Record<string, UploadSpec>>;

  buildUpdateUploads?: (
    parsed: TParsed,
    currentSlug: string,
    contentDirectory: string,
  ) => Promise<Record<string, UploadSpec>>;

  buildCurrentIndexKey: (currentDate: number, currentSlug: string) => TKey;

  extractFormData?: (parsed: TParsed) => TFormState["formData"];

  label: string;

  checkSlugConflict?: (
    slug: string,
    contentDirectory: string,
  ) => Promise<boolean>;

  deleteConflictingContent?: (
    slug: string,
    contentDirectory: string,
    email: string,
  ) => Promise<void>;

  deleteSuccessConfig?: ContentSuccessConfig;
}
