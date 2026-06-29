/**
 * Prerender wrapper for react-snap (postbuild step).
 *
 * Why a wrapper instead of the bare `react-snap` bin:
 *   The Chromium executable differs per environment.
 *     - Cloudflare Pages build: leave PUPPETEER_EXECUTABLE_PATH unset, so
 *       react-snap uses the Chromium that puppeteer downloads at install time.
 *     - Local / container builds with a system Chromium: set
 *       PUPPETEER_EXECUTABLE_PATH (e.g. /root/bin/chromium) and it is used.
 *
 * All other options (the route list, skipThirdPartyRequests, etc.) are read
 * from the "reactSnap" block in package.json so there is a single source of
 * truth.
 */
const { run } = require("react-snap");
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");

// Capture the pristine app shell as the SPA 404 fallback BEFORE react-snap
// overwrites build/index.html with the prerendered home route. Cloudflare Pages
// serves build/404.html natively for any unmatched path, which boots React
// Router client-side. This replaces the "/*  /index.html  200" catch-all that
// Cloudflare rejects as an infinite loop, while deep links keep working because
// every real route is prerendered to its own static HTML below.
try {
  const buildDir = path.resolve(__dirname, "..", "build");
  const indexHtml = path.join(buildDir, "index.html");
  const notFoundHtml = path.join(buildDir, "404.html");
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
    console.log("[prerender] Captured build/404.html SPA fallback from app shell.");
  } else {
    console.warn("[prerender] build/index.html not found; skipped 404.html fallback.");
  }
} catch (e) {
  console.error("[prerender] Could not write 404.html fallback:", e);
}

run({
  ...(pkg.reactSnap || {}),
  puppeteerExecutablePath:
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (pkg.reactSnap && pkg.reactSnap.puppeteerExecutablePath) ||
    undefined,
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
