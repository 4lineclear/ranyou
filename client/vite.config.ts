import react from "@vitejs/plugin-react";
import cssAutoImport from "vite-plugin-css-auto-import";
import tsconfigPaths from "vite-tsconfig-paths";

import { HttpProxy, UserConfig, defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  if (command === "serve") {
    return serve();
  } else {
    return build();
  }
});

const plugins = () => [react(), cssAutoImport(), tsconfigPaths()];

function build(): UserConfig {
  return {
    plugins: plugins(),
    esbuild: {
      drop: ["console"],
    },
    css: {
      modules: {
        localsConvention: "camelCase",
        scopeBehaviour: "local",
      },
    },
    build: {
      outDir: "../server/build/",
    },
  };
}

function serve(): UserConfig {
  return {
    plugins: plugins(),
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:8000`,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: configureProxy,
        },
      },
      // port: 8000,
    },
    css: {
      modules: {
        localsConvention: "camelCase",
        scopeBehaviour: "local",
      },
      preprocessorOptions: {
        scss: {
          modules: true,
        },
      },
    },
    build: {
      sourcemap: true,
    },
  };
}

function configureProxy(proxy: HttpProxy.Server) {
  proxy.on("error", (err) => {
    console.log("proxy error", err);
  });
  proxy.on("proxyReq", (_proxyReq, req) => {
    console.log("Sending Request to the Target:", req.method, req.url);
  });
  proxy.on("proxyRes", (proxyRes, req) => {
    console.log(
      "Received Response from the Target:",
      proxyRes.statusCode,
      req.url,
    );
  });
}
