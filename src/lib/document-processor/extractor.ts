import * as cheerio from "cheerio";

/**
 * Extract readable text and title from a web URL
 */
export async function extractFromUrl(url: string): Promise<{ title: string; content: string }> {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid URL protocol. Only http and https are supported.");
    }
  } catch (err: any) {
    throw new Error(`Invalid URL: ${err.message}`);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website (${response.status}): ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, nav, footer, header, svg, iframe, link, meta").remove();

  // Extract page title
  let title = $("title").text().trim() || $("h1").first().text().trim() || url;
  title = title.replace(/\s+/g, " ");

  // Extract main article or body
  let mainContent = $("main, article, #content, .content, #main").text();
  if (!mainContent || mainContent.trim().length < 50) {
    mainContent = $("body").text();
  }

  // Clean up whitespace and empty lines
  const cleanedText = mainContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n");

  if (!cleanedText || cleanedText.length < 10) {
    throw new Error("Could not extract meaningful readable text from this webpage.");
  }

  return {
    title,
    content: cleanedText,
  };
}

/**
 * Extract text from a PDF Buffer using pdf-parse
 */
export async function extractFromPdf(buffer: Buffer): Promise<{ title: string; content: string }> {
  // Dynamically require pdf-parse so it doesn't cause bundle issues on Edge
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);

  const content = (data.text || "").replace(/\r\n/g, "\n").trim();
  const title = (data.info?.Title || "").trim() || "Uploaded PDF Document";

  if (!content) {
    throw new Error("PDF file appears to be empty or contains only scanned images without selectable text.");
  }

  return {
    title,
    content,
  };
}

/**
 * Extract text from plain text, markdown, json, or csv file buffer
 */
export function extractFromTextFile(
  buffer: Buffer,
  fileName: string
): { title: string; content: string } {
  const content = buffer.toString("utf-8").trim();
  const title = fileName.replace(/\.[^/.]+$/, "");

  if (!content) {
    throw new Error("File is empty.");
  }

  return {
    title,
    content,
  };
}
