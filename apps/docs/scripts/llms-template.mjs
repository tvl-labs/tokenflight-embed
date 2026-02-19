export const SECTION_ORDER = ["home", "getting-started", "guides", "examples", "other"];

export const SECTION_LABELS = {
  home: "Home",
  "getting-started": "Getting Started",
  guides: "Guides",
  examples: "Examples",
  other: "Other",
};

function pushPageLinks(lines, pages) {
  for (const page of pages) {
    const description = page.description ? ` — ${page.description}` : "";
    lines.push(`- ${page.title}: ${page.url}${description}`);
  }
}

export function renderLlmsTxt({ siteUrl, pagesBySection }) {
  const lines = [
    "# TokenFlight Embed - llms.txt",
    "",
    "Compact index for LLM agents and tooling.",
    `Base URL: ${siteUrl}`,
    "",
    "For full structured context, use:",
    `- ${siteUrl}/llms-full.txt`,
    "",
  ];

  const corePages = [
    ...(pagesBySection.home ?? []),
    ...(pagesBySection["getting-started"] ?? []),
  ];
  if (corePages.length > 0) {
    lines.push("## Core");
    pushPageLinks(lines, corePages);
    lines.push("");
  }

  for (const section of ["guides", "examples", "other"]) {
    const pages = pagesBySection[section] ?? [];
    if (pages.length === 0) continue;
    lines.push(`## ${SECTION_LABELS[section]}`);
    pushPageLinks(lines, pages);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderLlmsFullTxt({ siteUrl, pagesBySection }) {
  const lines = [
    "# TokenFlight Embed - llms-full.txt",
    "",
    "Structured full index for LLM retrieval.",
    `Base URL: ${siteUrl}`,
    "",
  ];

  for (const section of SECTION_ORDER) {
    const pages = pagesBySection[section] ?? [];
    if (pages.length === 0) continue;

    lines.push(`## ${SECTION_LABELS[section]}`);
    lines.push("");

    for (const page of pages) {
      lines.push(`### ${page.title}`);
      lines.push(`- URL: ${page.url}`);
      lines.push(`- Slug: ${page.slug || "/"}`);
      lines.push(`- Description: ${page.description || ""}`);
      lines.push(`- Summary: ${page.summary || page.description || ""}`);
      lines.push(`- Source: ${page.sourcePath}`);
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
