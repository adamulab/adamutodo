import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",

      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "site.webmanifest",
      ],

      manifest: {
        name: "Dawn — Plan Tomorrow Tonight",
        short_name: "Dawn",
        description:
          "Plan tomorrow tonight — tasks, habits, notes, and reflection in one calm daily planner.",
        theme_color: "#1C1730",
        background_color: "#1C1730",
        display: "standalone",
        display_override: ["standalone", "fullscreen"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        categories: ["productivity", "utilities"],
        shortcuts: [
          {
            name: "Plan Tomorrow",
            short_name: "Plan Tomorrow",
            description: "Jump straight to tomorrow's plan",
            url: "/?view=tomorrow",
          },
        ],
        related_applications: [],
        prefer_related_applications: false,
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        skipWaiting: false,
        clientsClaim: true,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "app-shell",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },

      devOptions: { enabled: true },
    }),
  ],

  base: "/",
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
});
