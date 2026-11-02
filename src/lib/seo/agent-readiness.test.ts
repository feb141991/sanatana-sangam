import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { POST, GET } from "@/app/api/mcp/route";
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

  it("Pillar 4: llms.txt strictly adheres to llmstxt.org and links machine endpoints", () => {
    const llms = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");
    expect(llms.startsWith("# Shoonaya")).toBe(true);
    expect(llms).toContain("> Multi-tradition spiritual companion");
    expect(llms).toContain("/.well-known/mcp/server-card.json");
    expect(llms).toContain("/api/mcp");
    expect(llms).toContain("/assets/js/webmcp.js");
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
});

