import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import generouted from "@generouted/react-router/plugin";

function restartWhenPageRoutesChange(): Plugin {
  const pagesDirectory = path.resolve(__dirname, "src/pages");
  const routeFile = /\.(jsx|tsx|mdx)$/;

  return {
    name: "restart-when-page-routes-change",
    configureServer(server) {
      let restartTimer: ReturnType<typeof setTimeout> | undefined;

      const restart = (file: string) => {
        if (!file.startsWith(`${pagesDirectory}${path.sep}`) || !routeFile.test(file)) return;
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => void server.restart(), 150);
      };

      server.watcher.on("add", restart);
      server.watcher.on("unlink", restart);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    generouted(),
    restartWhenPageRoutesChange(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100, // You can bump this up if CPU gets hot
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
});
