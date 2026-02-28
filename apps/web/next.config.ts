import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@soulpair/shared'],
  turbopack: {
    resolveAlias: {
      '@react-native-async-storage/async-storage': './empty-module.js',
      'pino-pretty': './empty-module.js',
    },
  },
};

export default nextConfig;
