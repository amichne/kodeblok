import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  root: "client",
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@lib": path.resolve(__dirname, "../lib"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
});
