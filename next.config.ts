import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

function getRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const urls = [
    process.env.S3_PUBLIC_URL_BASE,
    process.env.S3_ENDPOINT,
  ].filter(Boolean) as string[];

  if (urls.length === 0) {
    return [
      {
        protocol: "https",
        hostname: "**",
      },
    ];
  }

  return urls.map((value) => {
    const url = new URL(value);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      pathname: `${url.pathname.replace(/\/$/, "")}/**`,
    };
  });
}

const nextConfig: NextConfig = {
  images: {
      unoptimized: true,
      remotePatterns: getRemotePatterns(),
  },
};

export default withNextIntl(nextConfig);
