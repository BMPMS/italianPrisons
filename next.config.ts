import type { NextConfig } from "next";

const repoName = "italianPrisons"; // 🔁 change this to your repo name

const isGitHubPages = process.env.DEPLOY_ENV === "GH_PAGES";

const nextConfig: NextConfig = {
    output: "export", // ⬅️ this tells Next.js to use `next export`
    basePath: isGitHubPages ? `/${repoName}` : "",
    assetPrefix: isGitHubPages ? `/${repoName}/` : "",
    trailingSlash: true,
};
export default nextConfig;
