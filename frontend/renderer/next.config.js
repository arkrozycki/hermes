/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../dist' : '.next',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
