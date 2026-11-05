import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { POST, GET } from "@/app/api/mcp/route";
import { GET as getMarkdown } from "@/app/api/content-negotiation/route";
import { middleware } from "@/middleware";
import sitemap from "@/app/sitemap";
import { NextRequest } from "next/server";

describe("Agent-Readiness 8-Pillars Validation", () => {
  it("Pillar 1: robots.txt / robots.ts includes search & AI crawler bots", () => {
    const robotsModule = readFileSync(resolve(process.cwd(), "src/app/robots.ts"), "utf8");
    expect(robotsModule).toContain("Google-Agent");
    expect(robotsModule).toContain("Google-CloudVertexBot");
    expect(robotsModule).toContain("Google-NotebookLM");
    expect(robotsModule).toContain("GPTBot");
    expect(robotsModule).toContain("ClaudeBot");
    expect(robotsModule).toContain("PerplexityBot");
  });

  it("Pillar 1: middleware serves Content-Signal in robots.txt text and header", async () => {
    const req = new NextRequest("https://www.shoonaya.com/robots.txt");
    const res = await middleware(req);
    expect(res.headers.get("Content-Signal")).toBe("search=yes, ai-train=no");
    expect(res.headers.get("Content-Type")).toContain("text/plain");

    const text = await res.text();
    expect(text).toContain("Content-Signal: search=yes, ai-train=no");
    expect(text).toContain("Sitemap: https://www.shoonaya.com/sitemap.xml");
  });

  it("Pillar 2 & 3: Structured data in landing.html and JsonLd contains Organization, sameAs, and Offers", () => {
    const landingHtml = readFileSync(resolve(process.cwd(), "public/landing.html"), "utf8");
    expect(landingHtml).toContain('"@type": "Organization"');
    expect(landingHtml).toContain('"@type": "Service"');
    expect(landingHtml).toContain('"@type": "SoftwareApplication"');
    expect(landingHtml).toContain("https://apps.apple.com/app");
    expect(landingHtml).toContain("https://play.google.com/store/apps");
    expect(landingHtml).toContain('"price": "0"');
  });

  it("Pillar 4: llms.txt strictly adheres to llmstxt.org and links machine endpoints", () => {
    const llms = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");
    expect(llms.startsWith("# Shoonaya")).toBe(true);
    expect(llms).toContain("> Multi-tradition spiritual companion");
    expect(llms).toContain("/.well-known/mcp/server-card.json");
    expect(llms).toContain("/api/mcp");
    expect(llms).toContain("/assets/js/webmcp.js");
  });

  it("Pillar 5: Content negotiation rewrites Accept: text/markdown to llms.txt and token-efficient page markdown", async () => {
    // 1. Root /
    const rootReq = new NextRequest("https://www.shoonaya.com/", {
      headers: { Accept: "text/markdown" },
    });
    const rootRes = await middleware(rootReq);
    expect(rootRes.headers.get("Content-Type")).toContain("text/markdown");
    expect(rootRes.headers.get("Vary")).toBe("Accept");

    // 2. /pricing
    const pricingReq = new NextRequest("https://www.shoonaya.com/pricing", {
      headers: { Accept: "text/markdown" },
    });
    const pricingRes = await middleware(pricingReq);
    expect(pricingRes.headers.get("Content-Type")).toContain("text/markdown");

    // 3. /vrat/ekadashi
    const vratReq = new NextRequest("https://www.shoonaya.com/vrat/ekadashi", {
      headers: { Accept: "text/markdown" },
    });
    const vratRes = await middleware(vratReq);
    expect(vratRes.headers.get("Content-Type")).toContain("text/markdown");
  });

  it("Pillar 6 & 8: publishes valid SEP-1649 / SEP-2127 MCP server card", () => {
    const serverCardPath = resolve(process.cwd(), "public/.well-known/mcp/server-card.json");
    const companionCardPath = resolve(process.cwd(), "public/.well-known/mcp.json");

    expect(existsSync(serverCardPath)).toBe(true);
    expect(existsSync(companionCardPath)).toBe(true);

    const card = JSON.parse(readFileSync(serverCardPath, "utf8"));
    expect(card.$schema).toBe("https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json");
    expect(card.name).toBe("shoonaya-mcp");
    expect(card.endpoint).toContain("/.well-known/mcp/server-card.json");
    expect(Array.isArray(card.tools)).toBe(true);

    const toolNames = card.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("getPanchang");
    expect(toolNames).toContain("getFestivalDetails");
    expect(toolNames).toContain("searchScripture");
    expect(toolNames).toContain("getPathshalaLessons");
    expect(toolNames).toContain("askDharmaGuidance");
  });

  it("Pillar 7: public/assets/js/webmcp.js exists and exports WebMCP tools", () => {
    const webmcpPath = resolve(process.cwd(), "public/assets/js/webmcp.js");
    expect(existsSync(webmcpPath)).toBe(true);

    const script = readFileSync(webmcpPath, "utf8");
    expect(script).toContain("navigator.modelContext");
    expect(script).toContain("registerTool");
    expect(script).toContain("getPanchang");
    expect(script).toContain("getFestivalDetails");
  });

  it("Pillar 8: /api/mcp route executes JSON-RPC 2.0 initialize, tools/list, and tools/call", async () => {
    // 1. GET metadata
    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData.name).toBe("shoonaya-mcp");
    expect(Array.isArray(getData.tools)).toBe(true);

    // 2. POST initialize
    const initReq = new NextRequest("https://www.shoonaya.com/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    const initRes = await POST(initReq);
    const initData = await initRes.json();
    expect(initData.result.serverInfo.name).toBe("shoonaya-mcp");

    // 3. POST tools/list
    const listReq = new NextRequest("https://www.shoonaya.com/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });
    const listRes = await POST(listReq);
    const listData = await listRes.json();
    expect(listData.result.tools.length).toBeGreaterThanOrEqual(5);

    // 4. POST tools/call getPanchang
    const callReq = new NextRequest("https://www.shoonaya.com/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "getPanchang",
          arguments: { date: "2026-11-02" },
        },
      }),
    });
    const callRes = await POST(callReq);
    const callData = await callRes.json();
    expect(callData.result.content[0].text).toContain("Shoonaya");
    expect(callData.result.content[0].text).toContain("2026-11-02");

    // 5. POST tools/call getFestivalDetails
    const festReq = new NextRequest("https://www.shoonaya.com/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "getFestivalDetails",
          arguments: { festivalOrVrat: "ekadashi" },
        },
      }),
    });
    const festRes = await POST(festReq);
    const festData = await festRes.json();
    expect(festData.result.content[0].text).toContain("Ekadashi");
  });

  it("Findability: Sitemap carries recent lastmod dates on every URL", async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(50);
    for (const entry of entries) {
      expect(entry.lastModified).toBeDefined();
    }
  });

  it("Commercial Legibility: Landing HTML links about, pricing, contact, privacy, and terms", () => {
    const landingHtml = readFileSync(resolve(process.cwd(), "public/landing.html"), "utf8");
    expect(landingHtml).toContain('href="/about"');
    expect(landingHtml).toContain('href="/pricing"');
    expect(landingHtml).toContain('href="/contact"');
    expect(landingHtml).toContain('href="/privacy"');
    expect(landingHtml).toContain('href="/terms"');
  });

  it("Token Budget: Serves token-efficient markdown representations for other pages", async () => {
    // Pricing
    const pReq = new NextRequest("https://www.shoonaya.com/api/content-negotiation?path=/pricing");
    const pRes = await getMarkdown(pReq);
    const pText = await pRes.text();
    expect(pText).toContain("# Shoonaya Pricing");
    expect(pText).toContain("₹0");

    // Vrat
    const vReq = new NextRequest("https://www.shoonaya.com/api/content-negotiation?path=/vrat/ekadashi");
    const vRes = await getMarkdown(vReq);
    const vText = await vRes.text();
    expect(vText).toContain("Ekadashi");
    expect(vText).toContain("Significance");

    // About
    const aReq = new NextRequest("https://www.shoonaya.com/api/content-negotiation?path=/about");
    const aRes = await getMarkdown(aReq);
    const aText = await aRes.text();
    expect(aText).toContain("# About Shoonaya");
  });
});
