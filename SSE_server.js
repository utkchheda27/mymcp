
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { z } from "zod";

// --- MCP server factory (one per session) ---

function createWeatherServer() {
  const server = new McpServer({ name: "sse-weather-server", version: "1.0.0" });

  server.registerTool(
    "getWeatherDataByCityName",
    {
      description: "Return simple fake weather for a city.",
      inputSchema: z.object({
        city: z.string(),
      }),
    },
    async ({ city }) => {
      const lower = city.toLowerCase();
      const data =
        lower === "mumbai"
          ? { city: "Mumbai", temperature: 20, description: "Sunny" }
          : { city, temperature: null, description: "City not found" };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    }
  );

  return server;
}

// --- Express app + transport wiring ---

const app = createMcpExpressApp();

// Store transports by session ID so GET /mcp can stream later
const transports = {};

// POST /mcp: handle JSON-RPC over HTTP
app.post("/mcp", async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"];
    let transport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing session
      transport = transports[sessionId];
    } else {
      // New session: create transport + server
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = transport;
        },
      });

      const server = createWeatherServer();
      await server.connect(transport);
    }

    // IMPORTANT: Accept must include both JSON + SSE
    // Accept: application/json, text/event-stream
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Error in POST /mcp:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// GET /mcp: establish SSE stream
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing MCP session ID");
    return;
  }

  const transport = transports[sessionId];
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("Error in GET /mcp:", err);
    if (!res.headersSent) {
      res.status(500).send("Error establishing SSE stream");
    }
  }
});

// --- Start server ---

const PORT = 3010;
app.listen(PORT, "127.0.0.1", (err) => {
  if (err) {
    console.error("Failed to start SSE+MCP server:", err);
    process.exit(1);
  }
  console.log(`SSE+MCP server on http://127.0.0.1:${PORT}/mcp`);
});