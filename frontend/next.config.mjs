/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Solana packages for proper module resolution
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
  ],

  // Enable Turbopack (default in Next.js 16)
  turbopack: {},

  // Webpack config for fallback compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }

    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    return config;
  },
};

export default nextConfig;
