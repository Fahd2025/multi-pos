import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/api/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5062',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        pathname: '/api/**',
      },
      // More specific pattern for image endpoints
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5062',
        pathname: '/api/v1/images/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
