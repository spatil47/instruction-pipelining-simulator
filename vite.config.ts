import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true";

// https://vite.dev/config/
export default defineConfig({
  base: isGithubPagesBuild && repoName ? `/${repoName}/` : "/",
  plugins: [vue()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
