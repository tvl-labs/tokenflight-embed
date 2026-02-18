import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    target: "es2020",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "TokenFlightAdapterAppKit",
      formats: ["es", "umd"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["@tokenflight/swap", "@reown/appkit"],
      output: {
        globals: {
          "@tokenflight/swap": "TokenFlightSwap",
          "@reown/appkit": "ReownAppKit",
        },
      },
    },
  },
});
