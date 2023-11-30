/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'Build',
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  env: {
    ENV_MODE: process.env.ENV_MODE
  }
}

module.exports = nextConfig