import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ttf|html)$/i,
      type: 'asset/resource'
    });
    return config;
  },
  experimental: {
    serverMinification: false, // the server minification unfortunately breaks the selector class names
    instrumentationHook: true, // Required for Sentry instrumentation
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Organization and project slugs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppresses source map uploading logs during build
  silent: !process.env.CI,

  // Automatically create releases in Sentry
  release: {
    create: true,
    finalize: true,
    deploy: {
      env: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    },
  },

  // Upload source maps for error debugging
  widenClientFileUpload: true,

  // Hides source maps from generated client bundles (security)
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  // https://docs.sentry.io/product/crons/
  automaticVercelMonitors: true,
};

// Only apply Sentry in production or if explicitly enabled
const shouldUseSentry =
  process.env.SENTRY_DSN &&
  (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true');

export default shouldUseSentry
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
