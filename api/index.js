// Vercel serverless entry. The same Express app that runs in local dev
// and `npm start` is exported as the handler for every /api/* request.
//
// IMPORTANT: SQLite lives in /tmp on Vercel (the only writable path) and
// that storage is ephemeral — it resets on cold starts and is not shared
// between concurrent function instances. For durable, multi-instance
// persistence point TRUSTSFER_DB at a mounted volume or swap the storage
// layer in server/db.js for a hosted database. Auth0 verification, the
// REST surface, and seeding all work as-is.

import app from "../server/app.js";

export default app;
