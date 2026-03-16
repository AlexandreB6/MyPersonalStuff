import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise les images distantes depuis TMDB (posters, backdrops, photos)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
