/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // The editor is branded as the editor; deployments can override via env.
    // The public export app uses the neutral default from getSiteConfig().
    NEXT_PUBLIC_SITE_TITLE:
      process.env.NEXT_PUBLIC_SITE_TITLE || "Recipe Editor",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
