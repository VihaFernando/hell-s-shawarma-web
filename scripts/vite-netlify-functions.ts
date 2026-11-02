// Dev-only Vite plugin: serves netlify/functions/<name>.js at /api/<name> (the
// same mapping as the netlify.toml redirect), so `npm run dev` can use the blog
// admin's server functions without `netlify dev`. Production is unaffected;
// Netlify runs the real functions there.

import { existsSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadEnv, type Plugin } from "vite";

type HandlerResult = { statusCode: number; headers?: Record<string, string>; body?: string };
type Handler = (event: unknown, context: unknown) => Promise<HandlerResult>;

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function netlifyFunctionsDev(): Plugin {
  const dir = path.resolve("netlify/functions");

  return {
    name: "netlify-functions-dev",
    apply: "serve",
    configResolved(config) {
      // Functions read secrets from process.env (Vite only exposes VITE_* to the app).
      const env = loadEnv(config.mode, process.cwd(), "");
      for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const match = url.pathname.match(/^\/(?:api|\.netlify\/functions)\/([\w-]+)\/?$/);
        const file = match && path.join(dir, `${match[1]}.js`);
        if (!file || !existsSync(file)) return next();

        try {
          // Cache-bust so edits to the function file apply without restarting.
          const mod = (await import(`${pathToFileURL(file).href}?t=${Date.now()}`)) as {
            handler?: Handler;
          };
          if (!mod.handler) throw new Error(`${match![1]}.js has no exported handler`);

          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers[k.toLowerCase()] = v;
          }
          const result = await mod.handler(
            {
              httpMethod: req.method,
              path: url.pathname,
              headers,
              queryStringParameters: Object.fromEntries(url.searchParams),
              body: ["GET", "HEAD"].includes(req.method ?? "GET") ? null : await readBody(req),
            },
            {},
          );

          res.statusCode = result.statusCode;
          for (const [k, v] of Object.entries(result.headers ?? {})) res.setHeader(k, v);
          res.end(result.body ?? "");
        } catch (err) {
          server.config.logger.error(`[netlify-functions-dev] ${(err as Error).stack ?? err}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}
