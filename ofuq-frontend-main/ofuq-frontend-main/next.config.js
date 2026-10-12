/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.FRONTEND_VERIFY_OUTPUT || ".next",
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

module.exports = nextConfig;
