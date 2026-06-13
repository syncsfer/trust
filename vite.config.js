import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Embed the API directly inside the Vite dev server so /api/* is served
// by the same Node process that serves the front-end. This removes the
// need for a second process or a proxy, and removes the most common
// failure mode where the web app loads but the API isn't running.
function trustsferApi() {
  return {
    name: "trustsfer-api",
    async configureServer(server) {
      const { default: app } = await import("./server/app.js");
      server.middlewares.use(app);
    },
    async configurePreviewServer(server) {
      const { default: app } = await import("./server/app.js");
      server.middlewares.use(app);
    },
  };
}

export default defineConfig({
  plugins: [react(), trustsferApi()],
});
