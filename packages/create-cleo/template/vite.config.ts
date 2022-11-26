import { defineConfig } from "vite";
import { cleo } from "@ordinal/cleo";

export default defineConfig(() => {
  return {
    plugins: [cleo()],
  };
});
