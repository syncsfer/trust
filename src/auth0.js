// Auth0 SPA integration. Active only when the Vite env carries the
// tenant config — otherwise every export is a cheap no-op and the app
// runs on local accounts alone.
//
// Required env (set in .env / Vercel project settings):
//   VITE_AUTH0_DOMAIN     e.g. your-tenant.us.auth0.com
//   VITE_AUTH0_CLIENT_ID  the SPA application's client id
// Optional:
//   VITE_AUTH0_AUDIENCE   an Auth0 API identifier; when set, the access
//                         token is used as the bearer. Without it the
//                         (RS256) ID token is used, which the server
//                         also accepts with audience = client id.

import { createAuth0Client } from "@auth0/auth0-spa-js";

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const DOMAIN = (ENV.VITE_AUTH0_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const CLIENT_ID = ENV.VITE_AUTH0_CLIENT_ID || "";
const AUDIENCE = ENV.VITE_AUTH0_AUDIENCE || "";

export const auth0Configured = Boolean(DOMAIN && CLIENT_ID);

let clientPromise = null;

function getClient() {
  if (!auth0Configured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = createAuth0Client({
      domain: DOMAIN,
      clientId: CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin,
        ...(AUDIENCE ? { audience: AUDIENCE } : {}),
      },
      cacheLocation: "localstorage",
    });
  }
  return clientPromise;
}

async function bearerFromSession(client) {
  if (AUDIENCE) {
    return client.getTokenSilently();
  }
  const claims = await client.getIdTokenClaims();
  return claims ? claims.__raw : null;
}

// Begin the redirect login flow.
export async function auth0Login() {
  const client = await getClient();
  if (!client) throw new Error("Auth0 is not configured");
  await client.loginWithRedirect();
}

// Called on app boot. Completes a redirect callback if one is in the URL,
// then returns a bearer token if an Auth0 session exists — null otherwise.
export async function auth0Resume() {
  if (!auth0Configured) return null;
  const client = await getClient();
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") && params.has("state")) {
    try {
      await client.handleRedirectCallback();
    } finally {
      // Strip the auth params but keep the hash route.
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
  }
  try {
    const authed = await client.isAuthenticated();
    if (!authed) return null;
    return await bearerFromSession(client);
  } catch (e) {
    return null;
  }
}

export async function auth0Logout() {
  if (!auth0Configured) return;
  const client = await getClient();
  await client.logout({ logoutParams: { returnTo: window.location.origin } });
}
