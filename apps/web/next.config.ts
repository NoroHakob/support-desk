import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marshaldesk/shared", "@marshaldesk/db"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
