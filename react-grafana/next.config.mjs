// A static export that serves from a directory: relative asset URLs, no image optimizer.
const config = {
  output: 'export',
  distDir: 'dist',
  assetPrefix: './',
  images: { unoptimized: true },
};
export default config;
