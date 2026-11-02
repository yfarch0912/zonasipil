import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webRoot, "../..");

/** Konsumsi sumber TypeScript paket @zonasipil/* langsung, seperti pola monorepo. */
export default defineConfig({
  resolve: {
    alias: {
      "@zonasipil/engineering-core": path.resolve(repoRoot, "packages/engineering-core/src/index.ts"),
      "@zonasipil/application-registry": path.resolve(repoRoot, "packages/application-registry/src/index.ts"),
      "@zonasipil/app-calculator": path.resolve(repoRoot, "apps/calculator/src/index.ts"),
      "@zonasipil/app-quantity": path.resolve(repoRoot, "apps/quantity/src/index.ts"),
      "@zonasipil/app-concrete": path.resolve(repoRoot, "apps/concrete/src/index.ts"),
      "@zonasipil/app-steel": path.resolve(repoRoot, "apps/steel/src/index.ts"),
      "@zonasipil/app-foundation": path.resolve(repoRoot, "apps/foundation/src/index.ts"),
      "@zonasipil/app-rab": path.resolve(repoRoot, "apps/rab/src/index.ts"),
    },
  },
});
