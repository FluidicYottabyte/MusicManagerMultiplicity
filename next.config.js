/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Uploaded audio files can be large; keep in sync with Apache's
      // LimitRequestBody in deploy/apache-musicmanager.conf.
      bodySizeLimit: "200mb",
    },
  },
};

module.exports = nextConfig;
