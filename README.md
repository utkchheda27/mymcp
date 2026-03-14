*Basic local MCP server*
Setup a basic mcp server on cursor IDE and configured the mcp.json to add in weather data context
![custom MCP](assets/cursor_MCP_custom.png)
In example to prove context provision, gave prompt to check for weather for a city which is not Mumbai and it could not provide details due to lack of context.
![MCP context](assets/mcp_context.png)
With respect to prompting for specific city, context is passed and output is generated invariant of language
![Weather](assets/weather_hindi.png)
![Weather](assets/weather_english.png)