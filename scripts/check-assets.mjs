import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const htmlPath = resolve(projectRoot, "index.html");
const html = await readFile(htmlPath, "utf8");

const references = new Set();
for (const match of html.matchAll(/(?:src|href)=["'](assets\/[^"']+)["']/g)) {
  references.add(match[1]);
}
for (const match of html.matchAll(/url\(["']?(assets\/[^"')]+)["']?\)/g)) {
  references.add(match[1]);
}

const missing = [];
const casingMismatches = [];
const linuxUnsafeNames = [];

async function hasExactCase(reference) {
  let currentPath = projectRoot;
  for (const segment of reference.split("/")) {
    const entries = await readdir(currentPath);
    if (!entries.includes(segment)) return false;
    currentPath = resolve(currentPath, segment);
  }
  return true;
}

for (const reference of references) {
  if (!/^[a-z0-9][a-z0-9._/-]*$/i.test(reference)) {
    linuxUnsafeNames.push(reference);
  }
  try {
    await access(resolve(projectRoot, reference));
    if (!(await hasExactCase(reference))) casingMismatches.push(reference);
  } catch {
    missing.push(reference);
  }
}

const internalUrlPatterns = [
  /chatgpt\.site/i,
  /oaiusercontent\.com/i,
  /localhost:\d+/i,
  /file:\/\//i,
];
const internalUrls = internalUrlPatterns
  .filter((pattern) => pattern.test(html))
  .map((pattern) => pattern.source);

if (missing.length || casingMismatches.length || linuxUnsafeNames.length || internalUrls.length) {
  if (missing.length) {
    console.error("Отсутствуют локальные ресурсы:");
    missing.forEach((item) => console.error(`- ${item}`));
  }
  if (internalUrls.length) {
    console.error("Обнаружены служебные или локальные URL:");
    internalUrls.forEach((item) => console.error(`- ${item}`));
  }
  if (casingMismatches.length) {
    console.error("Регистр ссылок не совпадает с именами файлов:");
    casingMismatches.forEach((item) => console.error(`- ${item}`));
  }
  if (linuxUnsafeNames.length) {
    console.error("Имена используемых ресурсов должны содержать только латиницу и не иметь пробелов:");
    linuxUnsafeNames.forEach((item) => console.error(`- ${item}`));
  }
  process.exit(1);
}

console.log(`Проверено локальных ресурсов: ${references.size}. Пути совместимы с Linux.`);
