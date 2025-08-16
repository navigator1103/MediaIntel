/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for math-intrinsics module resolution issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'math-intrinsics/isNaN': 'math-intrinsics/isNaN.js',
    };
    
    // Ignore certain modules that cause issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  // Suppress specific warnings
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;