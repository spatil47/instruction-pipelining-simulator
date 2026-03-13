import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { loadEnv } from "vite";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHosts = env.DEV_ALLOWED_HOSTS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    base: isGithubPagesBuild && repoName ? `/${repoName}/` : "/",
    plugins: [vue()],
    server: allowedHosts?.length
      ? {
          allowedHosts,
        }
      : undefined,
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
