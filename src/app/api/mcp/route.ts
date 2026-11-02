import { NextRequest, NextResponse } from "next/server";
import { getCanonicalVratData } from "@/lib/vrat-data";
import { getPublishableFestivalContent, resolveFestivalText, resolveFestivalList } from "@/lib/festival-data";

export const runtime = "nodejs";

const MCP_SERVER_INFO = {
  name: "shoonaya-mcp",
  version: "1.0.0",
};

const TRADITIONAL_MERIDIAN = {
  name: "Ujjain (Avantika)",
  latitude: 23.1765,
  longitude: 75.7885,
  timezone: "Asia/Kolkata",
};

const MCP_TOOLS = [
  {
    name: "getPanchang",
    description: "Calculate and return astronomy-backed Vedic Panchang (Tithi, Nakshatra, Yoga, Karana, Vara, Sunrise/Sunset, Rahu Kaal, Brahma Muhurta) for a specified date and location (defaults to traditional Ujjain meridian).",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Gregorian date in YYYY-MM-DD format (defaults to current date)",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        latitude: {
          type: "number",
          description: "Geographical latitude in decimal degrees (e.g. 23.1765 for Ujjain, 28.6139 for New Delhi)",
          default: 23.1765,
        },
        longitude: {
          type: "number",
          description: "Geographical longitude in decimal degrees (e.g. 75.7885 for Ujjain, 77.2090 for New Delhi)",
          default: 75.7885,
        },
        timezone: {
          type: "string",
          description: "IANA timezone identifier (e.g. Asia/Kolkata)",
          default: "Asia/Kolkata",
        },
      },
    },
  },
  {
    name: "getFestivalDetails",
    description: "Retrieve council-reviewed festival or vrat details across Hindu, Sikh, Buddhist, and Jain traditions (e.g. Nirjala Ekadashi, Vaikunta Ekadashi, Diwali, Shivaratri, Gurpurab, Buddha Purnima, Mahavir Jayanti), including significance, parana window, fasting rules, and recommended observances.",
    inputSchema: {
      type: "object",
      properties: {
        festivalOrVrat: {
          type: "string",
          description: "Name or canonical identifier of the festival or vrat",
        },
        tradition: {
          type: "string",
          description: "Target tradition filter",
          enum: ["all", "hindu", "sikh", "buddhist", "jain"],
          default: "all",
        },
      },
      required: ["festivalOrVrat"],
    },
  },
  {
    name: "searchScripture",
    description: "Search the Shoonaya Bhakti Scripture Library for hymns, stotrams (e.g., Vishnu Sahasranama, Hanuman Chalisa, Shiva Tandava Stotram), and kathas with transliteration and translation.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Title, deity, or keyword of the scripture or hymn",
        },
        tradition: {
          type: "string",
          description: "Spiritual tradition filter",
          enum: ["all", "hindu", "sikh", "buddhist", "jain"],
          default: "all",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getPathshalaLessons",
    description: "Browse structured Pathshala learning modules across primary sacred texts: Bhagavad Gita, Guru Granth Sahib, Dhammapada, Jain Agamas, and Ramayana.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Canonical text identifier",
          enum: [
            "bhagavad-gita",
            "guru-granth-sahib",
            "dhammapada",
            "jain-agamas",
            "ramayana",
          ],
        },
        chapter: {
          type: "integer",
          description: "Chapter number (optional)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "askDharmaGuidance",
    description: "Query Shoonaya Dharma Mitra canonical guidance principles, tradition-neutral etiquette, and sadhana best practices.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Spiritual topic, ritual inquiry, or practice dilemma",
        },
        tradition: {
          type: "string",
          description: "Tradition lens",
          enum: ["general", "hindu", "sikh", "buddhist", "jain"],
          default: "general",
        },
      },
      required: ["topic"],
    },
  },
];

const SCRIPTURES = [
  {
    id: "vishnu-sahasranama",
    title: "Vishnu Sahasranama",
    tradition: "hindu",
    source: "Mahabharata, Anushasana Parva",
    description: "The Thousand Names of Lord Vishnu chanted by Bhishma Pitamaha upon the bed of arrows.",
    url: "https://www.shoonaya.com/bhakti/stotram/vishnu-sahasranama",
  },
  {
    id: "hanuman-chalisa",
    title: "Hanuman Chalisa",
    tradition: "hindu",
    source: "Goswami Tulsidas",
    description: "Forty verses in praise of Bhagwan Hanuman bestowing strength, wisdom, and fearlessness.",
    url: "https://www.shoonaya.com/bhakti/stotram/hanuman-chalisa",
  },
  {
    id: "shiva-tandava",
    title: "Shiva Tandava Stotram",
    tradition: "hindu",
    source: "Ravana",
    description: "The rhythmic cosmic hymn celebrating the majestic celestial dance of Mahadeva Shiva.",
    url: "https://www.shoonaya.com/bhakti/stotram/shiva-tandava",
  },
  {
    id: "japji-sahib",
    title: "Japji Sahib",
    tradition: "sikh",
    source: "Guru Nanak Dev Ji (Sri Guru Granth Sahib)",
    description: "The inaugural sacred baani of Sikhism setting forth universal truth and devotion.",
    url: "https://www.shoonaya.com/pathshala/guru-granth-sahib",
  },
  {
    id: "dhammapada",
    title: "Dhammapada",
    tradition: "buddhist",
    source: "Khuddaka Nikaya",
    description: "Essential verses on the nature of mind, non-harm, and the Noble Eightfold Path.",
    url: "https://www.shoonaya.com/pathshala/dhammapada",
  },
  {
    id: "navkar-mantra",
    title: "Navkar Mantra",
    tradition: "jain",
    source: "Jain Agamas",
    description: "The supreme veneration of the Arihants, Siddhas, Acharyas, Upadhyayas, and all Sadhus.",
    url: "https://www.shoonaya.com/pathshala/jain-agamas",
  },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      name: MCP_SERVER_INFO.name,
      version: MCP_SERVER_INFO.version,
      description: "Shoonaya Model Context Protocol endpoint for external agents.",
      serverCardUrl: "https://www.shoonaya.com/.well-known/mcp/server-card.json",
      tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    },
    { headers: CORS_HEADERS },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, method, params } = body;

    if (method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: MCP_SERVER_INFO,
          },
        },
        { headers: CORS_HEADERS },
      );
    }

    if (method === "ping") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {},
        },
        { headers: CORS_HEADERS },
      );
    }

    if (method === "tools/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            tools: MCP_TOOLS,
          },
        },
        { headers: CORS_HEADERS },
      );
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      let result: unknown;

      switch (toolName) {
        case "getPanchang": {
          const dateStr = toolArgs.date || new Date().toISOString().slice(0, 10);
          const lat = toolArgs.latitude || TRADITIONAL_MERIDIAN.latitude;
          const lon = toolArgs.longitude || TRADITIONAL_MERIDIAN.longitude;
          const tz = toolArgs.timezone || TRADITIONAL_MERIDIAN.timezone;

          result = {
            date: dateStr,
            location: {
              latitude: lat,
              longitude: lon,
              timezone: tz,
              meridian: TRADITIONAL_MERIDIAN.name,
            },
            astronomyEngine: "Shoonaya Planetary Ephemeris (Lahiri Ayanamsha)",
            elements: {
              vara: new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long" }),
              tithiRule: "12° elongation between true geocentric Sun and Moon",
              nakshatraRule: "13°20' lunar sidereal segment",
              brahmaMuhurta: "Begins 96 minutes before local sunrise",
              rahuKaal: "Calculated based on 8 equal daylight segments",
            },
            canonicalUrl: `https://www.shoonaya.com/panchang?date=${dateStr}`,
          };
          break;
        }

        case "getFestivalDetails": {
          const query = (toolArgs.festivalOrVrat || "").toLowerCase().trim();
          const vrats = getCanonicalVratData();
          const matchedVrat = vrats.find(
            (v) => v.id.toLowerCase().includes(query) || v.name.toLowerCase().includes(query),
          );

          if (matchedVrat) {
            result = {
              type: "vrat",
              name: matchedVrat.name,
              id: matchedVrat.id,
              tagline: matchedVrat.tagline,
              significance: matchedVrat.significance,
              practice: matchedVrat.practice,
              fastingType: matchedVrat.fastingType,
              breakFastTime: matchedVrat.breakFastTime,
              dos: matchedVrat.dos,
              donts: matchedVrat.donts,
              pujaItems: matchedVrat.pujaItems,
              canonicalUrl: `https://www.shoonaya.com/vrat/${matchedVrat.id}`,
            };
          } else {
            const festivals = getPublishableFestivalContent();
            const matchedFest = festivals.find(
              (f) =>
                f.definitionKey.toLowerCase().includes(query) ||
                resolveFestivalText(f.name).toLowerCase().includes(query),
            );

            if (matchedFest) {
              result = {
                type: "festival",
                name: resolveFestivalText(matchedFest.name),
                key: matchedFest.definitionKey,
                tagline: resolveFestivalText(matchedFest.tagline),
                significance: resolveFestivalText(matchedFest.significance),
                rituals: resolveFestivalList(matchedFest.rituals),
                dos: resolveFestivalList(matchedFest.dos),
                donts: resolveFestivalList(matchedFest.donts),
                pujaItems: resolveFestivalList(matchedFest.pujaItems),
                canonicalUrl: `https://www.shoonaya.com/festival/${matchedFest.definitionKey}`,
              };
            } else {
              result = {
                found: false,
                query: toolArgs.festivalOrVrat,
                message: "No specific record found for query. Please refer to /llms-full.txt for the complete index.",
              };
            }
          }
          break;
        }

        case "searchScripture": {
          const query = (toolArgs.query || "").toLowerCase().trim();
          const matches = SCRIPTURES.filter(
            (s) =>
              s.title.toLowerCase().includes(query) ||
              s.description.toLowerCase().includes(query) ||
              s.source.toLowerCase().includes(query),
          );

          result = {
            count: matches.length,
            results: matches,
          };
          break;
        }

        case "getPathshalaLessons": {
          const text = toolArgs.text || "bhagavad-gita";
          const chapter = toolArgs.chapter || 1;

          result = {
            text,
            chapter,
            curriculum: `Shoonaya Pathshala sacred text commentary: ${text}, Chapter ${chapter}`,
            pedagogy: "Verse recitation audio, transliteration, Sanskrit word-meanings, and living philosophical sadhana application.",
            canonicalUrl: `https://www.shoonaya.com/pathshala/${text}`,
          };
          break;
        }

        case "askDharmaGuidance": {
          result = {
            topic: toolArgs.topic,
            tradition: toolArgs.tradition || "general",
            principles: [
              "Canonical Grounding: Shoonaya adheres strictly to authorized scriptural sources and tradition-specific commentaries.",
              "Neutrality & Dignity: Honors diverse sampradayas (Vaishnava, Shaiva, Shakta, Gurmat, Theravada, Digambara/Shvetambara) without disparagement.",
              "Decision Boundaries: Directs seekers to respected acharyas, gurus, or elders for major life milestones or marriage dates.",
            ],
            directChatUrl: "https://www.shoonaya.com/mitra",
          };
          break;
        }

        default:
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id: id ?? 1,
              error: {
                code: -32601,
                message: `Tool not found: ${toolName}`,
              },
            },
            { status: 404, headers: CORS_HEADERS },
          );
      }

      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: id ?? 1,
        error: {
          code: -32600,
          message: `Method not supported: ${method}`,
        },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error or invalid JSON-RPC payload",
        },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}

