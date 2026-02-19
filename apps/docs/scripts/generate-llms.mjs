import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderLlmsTxt, renderLlmsFullTxt, SECTION_ORDER } from "./llms-template.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.resolve(__dirname, "../src/content/docs");
const PUBLIC_ROOT = path.resolve(__dirname, "../public");
const DEFAULT_SITE_URL = "https://embed.tokenflight.ai";

const SECTION_RANK = SECTION_ORDER.reduce((acc, section, index) => {
  acc[section] = index;
  return acc;
}, {});

function normalizeSiteUrl(value) {
  return (value || DEFAULT_SITE_URL).trim().replace(/\/+$/, "");
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function walkMdxFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkMdxFiles(absolute);
      files.push(...nested);
      continue;
    }

    if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, body: raw };
  }

  const data = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = (kv[2] || "").trim();
    value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    data[key] = value;
  }

  return {
    data,
    body: raw.slice(match[0].length),
  };
}

function toSlug(relPath) {
  const noExt = relPath.replace(/\.(md|mdx)$/i, "");
  if (noExt === "index") return "";
  if (noExt.endsWith("/index")) return noExt.slice(0, -"/index".length);
  return noExt;
}

function toSection(slug) {
  if (slug === "") return "home";
  if (slug === "getting-started") return "getting-started";
  if (slug.startsWith("guides/")) return "guides";
  if (slug.startsWith("examples/")) return "examples";
  return "other";
}

function cleanParagraphText(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/!\[[^\]]*]\([^)]*\)/g, " ");
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  cleaned = cleaned.replace(/<[^>]+>/g, " ");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, "");
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "");
  cleaned = cleaned.replace(/^\|.*\|$/gm, " ");
  cleaned = cleaned.replace(/^\s*[:\-| ]+\s*$/gm, " ");
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
  cleaned = cleaned.replace(/&[a-zA-Z]+;/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function truncate(text, maxLength = 280) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function extractSummary(body, fallback) {
  const withoutCode = body.replace(/```[\s\S]*?```/g, " ");
  const withoutImports = withoutCode
    .replace(/^\s*import\s+.+$/gm, "")
    .replace(/^\s*export\s+.+$/gm, "");
  const withoutJsx = withoutImports
    .split(/\r?\n/g)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (trimmed.startsWith("<") && trimmed.endsWith(">")) return false;
      return true;
    })
    .join("\n");

  const paragraphs = withoutJsx
    .split(/\r?\n\s*\r?\n/g)
    .map((paragraph) => cleanParagraphText(paragraph))
    .filter((paragraph) => paragraph.length > 0);

  for (const paragraph of paragraphs) {
    if (/[A-Za-z]/.test(paragraph) && paragraph.length >= 40) {
      return truncate(paragraph);
    }
  }

  if (paragraphs.length > 0) return truncate(paragraphs[0]);
  return fallback || "";
}

function comparePages(a, b) {
  const rankA = SECTION_RANK[a.section] ?? SECTION_RANK.other;
  const rankB = SECTION_RANK[b.section] ?? SECTION_RANK.other;
  if (rankA !== rankB) return rankA - rankB;
  return a.slug.localeCompare(b.slug);
}

async function main() {
  const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
  const absoluteFiles = await walkMdxFiles(DOCS_ROOT);

  const pages = [];

  for (const absoluteFile of absoluteFiles) {
    const relPath = toPosixPath(path.relative(DOCS_ROOT, absoluteFile));
    const sourcePath = toPosixPath(path.join("apps/docs/src/content/docs", relPath));
    const raw = await fs.readFile(absoluteFile, "utf8");
    const { data, body } = parseFrontmatter(raw);

    const slug = toSlug(relPath);
    const section = toSection(slug);
    const urlPath = slug ? `/${slug}/` : "/";
    const url = `${siteUrl}${urlPath}`;

    const title = data.title || (slug || "Home");
    const description = data.description || "";
    const summary = extractSummary(body, description);

    pages.push({
      slug,
      section,
      title,
      description,
      summary,
      url,
      sourcePath,
    });
  }

  pages.sort(comparePages);

  const pagesBySection = pages.reduce((acc, page) => {
    if (!acc[page.section]) acc[page.section] = [];
    acc[page.section].push(page);
    return acc;
  }, {});

  const llmsTxt = renderLlmsTxt({ siteUrl, pagesBySection });
  const llmsFullTxt = renderLlmsFullTxt({ siteUrl, pagesBySection });

  await fs.mkdir(PUBLIC_ROOT, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(PUBLIC_ROOT, "llms.txt"), llmsTxt, "utf8"),
    fs.writeFile(path.join(PUBLIC_ROOT, "llms-full.txt"), llmsFullTxt, "utf8"),
  ]);

  console.log(`[generate-llms] Generated ${pages.length} pages`);
}

main().catch((error) => {
  console.error("[generate-llms] Failed:", error);
  process.exitCode = 1;
});
