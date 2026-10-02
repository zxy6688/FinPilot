import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "finpilot-local-identity",
      configureServer(server) {
        server.middlewares.use("/__finpilot/health", (_req, res) => {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              status: "ok",
              process_id: process.pid,
              local_run_id: process.env.FINPILOT_RUN_ID || "",
            }),
          );
        });
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8002" },
  },
});
