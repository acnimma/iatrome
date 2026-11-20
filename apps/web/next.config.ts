import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  // Workspace packages ship TypeScript source.
  transpilePackages: ['@iatrome/game'],
};

export default nextConfig;
