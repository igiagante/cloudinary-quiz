import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  serverExternalPackages: [],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to load these modules on the client side
      config.resolve.fallback = {
        net: false,
        tls: false,
        fs: false,
        perf_hooks: false,
      };
    }
    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
