// build.js
const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["server.js"],        // your main Express file
  bundle: true,                      // bundle all imports into 1 file
  platform: "node",                  // backend build
  target: "node20",                  // adjust based on your Node version
  outfile: "dist/server.js",         // output location
  minify: true,                      // smaller file
  sourcemap: false,
}).catch(() => process.exit(1));
