import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ably's Node build pulls in got → cacheable-request → keyv, whose dynamic
  // require() can't be bundled by Turbopack. Externalizing it lets Node resolve
  // it at runtime on the server; the browser bundle uses Ably's keyv-free build.
  serverExternalPackages: ["ably"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
