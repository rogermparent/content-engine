import type { Key } from "lmdb";
import {
  createContent,
  SlugConflictError,
} from "@discontent/cms/content/createContent";
import { deleteContent } from "@discontent/cms/content/deleteContent";
import { updateContent } from "@discontent/cms/content/updateContent";
import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ContentFormState } from "recipe-website-common/controller/formState";
import { authenticateUser } from "./shared";
import type {
  ContentSuccessConfig,
  EditorContentConfig,
} from "./editorContentConfig";

function handleContentSuccess(
  config: ContentSuccessConfig,
  slug: string,
  currentSlug?: string,
) {
  if (currentSlug && currentSlug !== slug) {
    revalidatePath(config.itemBasePath + "/" + currentSlug);
  }
  revalidatePath(config.itemBasePath + "/" + slug);
  for (const listPath of config.listPaths) {
    revalidatePath(listPath.path, listPath.type);
  }
  revalidatePath("/");

  const redirectTarget = config.redirectTo
    ? config.redirectTo(slug)
    : config.itemBasePath + "/" + slug;
  redirect(redirectTarget);
}

export function createGenericActions<
  TData,
  TIndexValue,
  TKey extends Key,
  TFormState extends ContentFormState,
  TParsed,
>(
  editorConfig: EditorContentConfig<
    TData,
    TIndexValue,
    TKey,
    TFormState,
    TParsed
  >,
) {
  const { contentConfig, successConfig, label } = editorConfig;

  async function create(
    _prevState: TFormState | null,
    formData: FormData,
  ): Promise<TFormState> {
    const email = await authenticateUser();
    if (!email) {
      return { message: "Authentication required" } as TFormState;
    }

    const contentDirectory = getContentDirectory();

    const parseResult = editorConfig.parseFormData(formData);
    if (!parseResult.success) {
      return parseResult.state;
    }

    const { parsed } = parseResult;
    const { slug, data } = await editorConfig.buildCreateData(
      parsed,
      contentDirectory,
    );
    const uploads = editorConfig.buildCreateUploads
      ? await editorConfig.buildCreateUploads(parsed, contentDirectory)
      : undefined;

    try {
      await createContent({
        config: contentConfig,
        slug,
        data,
        contentDirectory,
        author: { name: email, email },
        commitMessage: `Add new ${label}: ${slug}`,
        uploads,
      });
    } catch (e) {
      if (e instanceof SlugConflictError) {
        return {
          message: `A ${label} with slug "${e.slug}" already exists.`,
          slugConflict: e.slug,
          formData: editorConfig.extractFormData?.(parsed),
        } as TFormState;
      }
      return {
        message: `Failed to create ${label}`,
        formData: editorConfig.extractFormData?.(parsed),
      } as TFormState;
    }

    handleContentSuccess(successConfig, slug);

    return { message: `${label} creation successful!` } as TFormState;
  }

  async function overwriteCreate(
    _prevState: TFormState | null,
    formData: FormData,
  ): Promise<TFormState> {
    const email = await authenticateUser();
    if (!email) {
      return { message: "Authentication required" } as TFormState;
    }

    const contentDirectory = getContentDirectory();

    const parseResult = editorConfig.parseFormData(formData);
    if (!parseResult.success) {
      return parseResult.state;
    }

    const { parsed } = parseResult;
    const { slug, data } = await editorConfig.buildCreateData(
      parsed,
      contentDirectory,
    );
    const uploads = editorConfig.buildCreateUploads
      ? await editorConfig.buildCreateUploads(parsed, contentDirectory)
      : undefined;

    if (editorConfig.deleteConflictingContent) {
      await editorConfig.deleteConflictingContent(
        slug,
        contentDirectory,
        email,
      );
    }

    try {
      await createContent({
        config: contentConfig,
        slug,
        data,
        contentDirectory,
        author: { name: email, email },
        commitMessage: `Add new ${label}: ${slug}`,
        uploads,
      });
    } catch {
      return {
        message: `Failed to create ${label}`,
        formData: editorConfig.extractFormData?.(parsed),
      } as TFormState;
    }

    handleContentSuccess(successConfig, slug);

    return { message: `${label} creation successful!` } as TFormState;
  }

  async function update(
    currentDate: number,
    currentSlug: string,
    _prevState: TFormState | null,
    formData: FormData,
  ): Promise<TFormState> {
    const email = await authenticateUser();
    if (!email) {
      return { message: "Authentication required" } as TFormState;
    }

    const contentDirectory = getContentDirectory();

    const parseResult = editorConfig.parseFormData(formData);
    if (!parseResult.success) {
      return parseResult.state;
    }

    const { parsed } = parseResult;
    const { slug, data } = await editorConfig.buildUpdateData(
      parsed,
      currentSlug,
      currentDate,
      contentDirectory,
    );
    const uploads = editorConfig.buildUpdateUploads
      ? await editorConfig.buildUpdateUploads(
          parsed,
          currentSlug,
          contentDirectory,
        )
      : undefined;

    // Check for slug conflict when renaming
    if (slug !== currentSlug && editorConfig.checkSlugConflict) {
      const hasConflict = await editorConfig.checkSlugConflict(
        slug,
        contentDirectory,
      );
      if (hasConflict) {
        return {
          message: `A ${label} with slug "${slug}" already exists.`,
          slugConflict: slug,
          formData: editorConfig.extractFormData?.(parsed),
        } as TFormState;
      }
    }

    const currentIndexKey = editorConfig.buildCurrentIndexKey(
      currentDate,
      currentSlug,
    );

    try {
      await updateContent({
        config: contentConfig,
        slug,
        currentSlug,
        currentIndexKey,
        data,
        contentDirectory,
        author: { name: email, email },
        commitMessage: `Update ${label}: ${slug}`,
        uploads,
      });
    } catch {
      return {
        message: `Failed to update ${label}`,
        formData: editorConfig.extractFormData?.(parsed),
      } as TFormState;
    }

    handleContentSuccess(successConfig, slug, currentSlug);

    return { message: `${label} update successful!` } as TFormState;
  }

  async function overwriteUpdate(
    currentDate: number,
    currentSlug: string,
    _prevState: TFormState | null,
    formData: FormData,
  ): Promise<TFormState> {
    const email = await authenticateUser();
    if (!email) {
      return { message: "Authentication required" } as TFormState;
    }

    const contentDirectory = getContentDirectory();

    const parseResult = editorConfig.parseFormData(formData);
    if (!parseResult.success) {
      return parseResult.state;
    }

    const { parsed } = parseResult;
    const { slug, data } = await editorConfig.buildUpdateData(
      parsed,
      currentSlug,
      currentDate,
      contentDirectory,
    );
    const uploads = editorConfig.buildUpdateUploads
      ? await editorConfig.buildUpdateUploads(
          parsed,
          currentSlug,
          contentDirectory,
        )
      : undefined;

    // Delete conflicting content at target slug
    if (slug !== currentSlug && editorConfig.deleteConflictingContent) {
      await editorConfig.deleteConflictingContent(
        slug,
        contentDirectory,
        email,
      );
    }

    const currentIndexKey = editorConfig.buildCurrentIndexKey(
      currentDate,
      currentSlug,
    );

    try {
      await updateContent({
        config: contentConfig,
        slug,
        currentSlug,
        currentIndexKey,
        data,
        contentDirectory,
        author: { name: email, email },
        commitMessage: `Update ${label}: ${slug}`,
        uploads,
      });
    } catch {
      return {
        message: `Failed to update ${label}`,
        formData: editorConfig.extractFormData?.(parsed),
      } as TFormState;
    }

    handleContentSuccess(successConfig, slug, currentSlug);

    return { message: `${label} update successful!` } as TFormState;
  }

  async function deleteContent_(date: number, slug: string): Promise<void> {
    const email = await authenticateUser();
    if (!email) {
      throw new Error("Authentication required");
    }

    const contentDirectory = getContentDirectory();
    const indexKey = editorConfig.buildCurrentIndexKey(date, slug);

    await deleteContent({
      config: contentConfig,
      slug,
      indexKey,
      contentDirectory,
      author: { name: email, email },
      commitMessage: `Delete ${label}: ${slug}`,
    });

    const deleteConfig = editorConfig.deleteSuccessConfig || successConfig;
    handleContentSuccess(deleteConfig, slug);
  }

  return {
    create,
    overwriteCreate,
    update,
    overwriteUpdate,
    delete: deleteContent_,
  };
}
