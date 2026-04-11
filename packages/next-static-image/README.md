# @discontent/next-static-image

A Next.js utility that solves a gap in the static export workflow: Next.js cannot optimize dynamically-referenced local images at build time the way it can with statically-imported images. This package fills that gap by pre-processing images with `sharp` at render/build time, generating responsive WebP variants and returning standard `getImageProps`-compatible props.

## How It Works

1. At render time, `getStaticImageProps` receives the source image path and an output directory.
2. It enqueues resizes at each responsive width, converting each variant to WebP with a configurable quality.
3. Resized files are written to the local output directory (cached by modification time so they are only regenerated when the source changes).
4. It returns the standard Next.js `getImageProps` result with the loader pointing at the generated files — no changes needed at the call site compared to using the built-in Next.js image optimization.

## API

### `getStaticImageProps(transform, imageProps)`

Main entry point for images that need local transformation.

```ts
const { props } = await getStaticImageProps(
  {
    srcPath: "/absolute/path/to/source/image.jpg",
    localOutputDirectory: "./public/image",
  },
  {
    src: "/relative/url/for/image.jpg",
    alt: "Description",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
);
```

Returns `StaticImageProps` containing `props` ready to spread onto a `<img>` element.

### `getPureStaticImageProps(imageProps)` / `pureLoader`

For cases where transformation is skipped (e.g. during development or for already-optimized images). `pureLoader` is a Next.js-compatible image loader that constructs responsive URLs without running `sharp`.

## Dependencies

Requires `sharp` as a peer dependency. `sharp` is listed as a direct dependency in packages that use this utility.

## Part of [Discontent](https://github.com/rogermparent/discontent)
