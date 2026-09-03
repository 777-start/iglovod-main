import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDir = resolve(projectRoot, "dist");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(resolve(projectRoot, "index.html"), resolve(outputDir, "index.html"));
await cp(resolve(projectRoot, "assets"), resolve(outputDir, "assets"), {
  recursive: true,
});
await cp(resolve(projectRoot, ".nojekyll"), resolve(outputDir, ".nojekyll"));

console.log("Production-сборка создана в папке dist.");
