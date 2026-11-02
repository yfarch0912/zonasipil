import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@zonasipil/engineering-core": path.resolve(
        root,
        "packages/engineering-core/src/index.ts",
      ),
      "@zonasipil/application-registry": path.resolve(
        root,
        "packages/application-registry/src/index.ts",
      ),
      "@zonasipil/app-calculator": path.resolve(root, "apps/calculator/src/index.ts"),
      "@zonasipil/app-quantity": path.resolve(root, "apps/quantity/src/index.ts"),
      "@zonasipil/app-concrete": path.resolve(root, "apps/concrete/src/index.ts"),
      "@zonasipil/app-steel": path.resolve(root, "apps/steel/src/index.ts"),
      "@zonasipil/app-foundation": path.resolve(root, "apps/foundation/src/index.ts"),
      "@zonasipil/app-rab": path.resolve(root, "apps/rab/src/index.ts"),
    },
  },
  test: {
    include: ["packages/*/tests/**/*.test.ts", "apps/*/tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "apps/structure/**", "**/dist/**"],
  },
});
