import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project sites need the repository name as the base path.
  // The GitHub Actions workflow sets VITE_BASE_PATH automatically.
  base: process.env.VITE_BASE_PATH || "/",
});