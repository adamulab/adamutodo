import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt" instead of "autoUpdate" — gives the app control over when
      // the new service worker activates, preventing stale shell mid-session.
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
        // Only pre-cache static build assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // Ensure the service worker takes control immediately on install
        // without waiting for all existing tabs to close.
        skipWaiting: false, // we handle this manually via the update prompt
        clientsClaim: true,

        runtimeCaching: [
          // ── CRITICAL: Firestore real-time connections must NEVER be cached ──
          // Firestore WebChannel uses long-lived streaming HTTP requests to
          // https://firestore.googleapis.com. Caching these breaks onSnapshot
          // in installed PWAs, causing the timeline and todo list to go stale.
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },

          // ── Firebase Auth token refresh must also bypass cache ──
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },

          // ── Firebase Storage (if used in future) ──
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },

          // ── Google Fonts — safe to cache aggressively ──
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── App navigation — NetworkFirst so updates reach users promptly ──
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
