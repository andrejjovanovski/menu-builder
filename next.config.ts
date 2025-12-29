import type { NextConfig } from "next";
// 1. Import the next-intl plugin
import createNextIntlPlugin from 'next-intl/plugin';

// 2. Point it to your i18n.ts file in the root
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* your existing config options here */
};

// 3. Wrap your config with the plugin
export default withNextIntl(nextConfig);