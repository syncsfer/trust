// Production entry point. The Vite dev server mounts the same app as
// middleware (see vite.config.js), so this file is only used when the
// project has been built (`npm run build` → `npm start`).

import app, { API_VERSION } from "./app.js";

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, () => {
  console.log(`TrustSfer API v${API_VERSION} + web listening on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[api] Port ${PORT} is already in use — another server process is probably still running.\n` +
        `[api] Stop it (e.g. \`pkill -f "node server/index.js"\`) and start again.`
    );
    process.exit(1);
  }
  throw err;
});
