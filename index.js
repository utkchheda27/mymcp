import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";


const server = new McpServer({ name: "Weather-MCP", version: "1.0.0" });
// MCP servers can provide different types of context,
// resources(file content, database records,api responses etc.)
// tools(functions that can be called by the client)
// prompts(facts, knowledge, etc.)
// capabilities(what the server can do)

// zod is for schema validation
// The older HTTP+SSE transport (protocol version 2024‑11‑05) is supported only for backwards compatibility.
// New implementations should prefer Streamable HTTP.

// Tools let MCP clients ask your server to take actions. They are usually the main way that LLMs call into your application.
server.registerTool(
  "getWeatherDataByCityName",
  {
    description: "Get simple weather information for a given city name.",
    inputSchema: z.object({
      city: z.string(),
    }),
  },
  async ({ city }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getWeatherDataByCity(city)),
        },
      ],
    };
  }
);

async function getWeatherDataByCity(city){
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}`);
    // const data = await response.json();
    // return data;
    if(city.toLowerCase() === "mumbai"){
        return {
            city: "Mumbai",
            temperature: 20,
            description: "Sunny",
        }
    }else{
        return {
            city: "City not found",
            temperature: null,
            description: "City not found",
        }
    }
}


async function init() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server listening on stdio");
}

init();

/*
const app = createMcpExpressApp();

// Stateless Streamable HTTP: a fresh server+transport per request.
app.post("/mcp", async (req, res) => {
  try {
    const server = new McpServer({ name: "my-server", version: "1.0.0" });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

const PORT = 3000;
app.listen(PORT, "127.0.0.1", (error) => {
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`MCP server listening on http://127.0.0.1:${PORT}/mcp`);
});
*/


/*Tools can return images and audio too
// e.g. const chartPngBase64 = fs.readFileSync('chart.png').toString('base64');
server.registerTool('generate-chart', { description: 'Generate a chart image' }, async () => ({
    content: [
        {
            type: 'image',
            data: chartPngBase64,
            mimeType: 'image/png'
        }
    ]
}));

// e.g. const audioBase64 = fs.readFileSync('speech.wav').toString('base64');
server.registerTool(
    'text-to-speech',
    {
        description: 'Convert text to speech',
        inputSchema: { text: z.string() }
    },
    async ({ text }) => ({
        content: [
            {
                type: 'audio',
                data: audioBase64,
                mimeType: 'audio/wav'
            }
        ]
    })
);
*/