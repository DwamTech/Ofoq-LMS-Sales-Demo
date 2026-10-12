const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { cpus: 2 },
  eslint: {
    // Production builds must pass lint validation.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Production builds must pass TypeScript validation.
    ignoreBuildErrors: false,
  },
  images: {
    domains: ["localhost"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { and: [/\.(js|ts|md)x?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            prettier: false,
            svgo: true,
            svgoConfig: { plugins: [{ removeViewBox: false }] },
            titleProp: true,
          },
        },
      ],
    });

    return config;
  },
};

module.exports = (phase) => ({
  ...nextConfig,
  // A production build must never replace chunks used by the running dev server.
  distDir:
    process.env.FRONTEND_VERIFY_OUTPUT ||
    (phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"),
});
