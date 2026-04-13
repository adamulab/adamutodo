import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
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
        name: "TaskFlow",
        short_name: "TaskFlow",
        description: "Professional Todo App by AdamuCreates",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        display_override: ["standalone", "fullscreen"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        categories: ["productivity", "utilities"],
        // icons: [
        //   {
        //     src: "/icon-72x72.png",
        //     sizes: "72x72",
        //     type: "image/png",
        //   },
        //   {
        //     src: "/icon-96x96.png",
        //     sizes: "96x96",
        //     type: "image/png",
        //   },
        //   {
        //     src: "/icon-128x128.png",
        //     sizes: "128x128",
        //     type: "image/png",
        //   },
        //   {
        //     src: "/icon-144x144.png",
        //     sizes: "144x144",
        //     type: "image/png",
        //   },
        //   {
        //     src: "/icon-152x152.png",
        //     sizes: "152x152",
        //     type: "image/png",
        //   },
        //   {
        //     src: "/icon-192x192.png",
        //     sizes: "192x192",
        //     type: "image/png",
        //     purpose: "any maskable",
        //   },
        //   {
        //     src: "/icon-384x384.png",
        //     sizes: "384x384",
        //     type: "image/png",
        //   },
        //   {
        //     src: "/icon-512x512.png",
        //     sizes: "512x512",
        //     type: "image/png",
        //     purpose: "any maskable",
        //   },
        // ],
        screenshots: [
          {
            src: "/screenshot1.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "TaskFlow Dashboard",
          },
          {
            src: "/screenshot2.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
            label: "TaskFlow Mobile",
          },
        ],
        shortcuts: [
          {
            name: "New List",
            short_name: "New List",
            description: "Create a new todo list",
            url: "/?action=new-list",
            icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
          },
        ],
        related_applications: [],
        prefer_related_applications: false,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
