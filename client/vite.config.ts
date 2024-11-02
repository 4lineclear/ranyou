import { HttpProxy, UserConfig, defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  if (command === "serve") {
    return serve();
  } else {
    return build();
  }
});

function build(): UserConfig {
  return {
    plugins: [],
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
      outDir: "../build/",
    },
  };
}

function serve(): UserConfig {
  return {
    plugins: [],
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

function getPorts(opts: Record<string, string>) {
  const server = parseInt(opts.VITE_DEV_SERVER_PORT);
  const client = parseInt(opts.VITE_DEV_CLIENT_PORT);
  return {
    server,
    client,
  };
}
