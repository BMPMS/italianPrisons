import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        unoptimized: true, // Required for static export on GitHub Pages
    },
    assetPrefix: isProd ? '/italianPrisons/' : '',
    basePath: isProd ? '/italianPrisons' : '',
    output: 'export',
};

export default nextConfig;
