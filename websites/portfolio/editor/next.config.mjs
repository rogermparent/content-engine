/** @type {import('next').NextConfig} */
const nextConfig = {
  // lmdb is a native module; bundling it breaks the binding resolution at
  // runtime. The content index lives in LMDB, so every page that lists projects
  // depends on this.
  serverExternalPackages: ["lmdb"],
};

export default nextConfig;
