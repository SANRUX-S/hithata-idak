import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/story", "/safety", "/resources"],
        disallow: [
          "/portal",
          "/portal/*",
          "/api/*",
          "/chat", // Prevent indexing of interactive session states
        ],
      },
    ],
    sitemap: "https://hithataidak.lk/sitemap.xml",
  };
}

