/** @type {import('next').NextConfig} */
import { createMDX } from 'fumadocs-mdx/next';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co'
      }
    ],
  },
};

const withMDX = createMDX({
  // customize the config file path
  configPath: "source.config.js"
});

export default withMDX(nextConfig);
