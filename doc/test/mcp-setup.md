# Chrome DevTools MCP Setup Guide

This guide explains how to set up and configure the Chrome DevTools Model Context Protocol (MCP) server for automated browser testing of the e-commerce demo site.

## What is Chrome DevTools MCP?

The Chrome DevTools MCP server provides programmatic access to Chrome browser automation through the Model Context Protocol. It enables Claude Code to interact with web pages, take snapshots, fill forms, click elements, and monitor network activity and console logs — all through MCP tools.

**Official Documentation**: [https://github.com/ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)

---

## Prerequisites

Before setting up the MCP server, ensure you have:

- **Node.js and npm** installed (for running `npx`)
- **Google Chrome** installed on your system
- **Claude Code** CLI configured and running
- **Terminal access** to start Chrome with remote debugging

---

## Step 1: Start Chrome with Remote Debugging

The Chrome DevTools MCP server connects to Chrome via the Chrome DevTools Protocol, which requires Chrome to be started with remote debugging enabled on port `9222`.

### macOS

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### Linux

```bash
google-chrome --remote-debugging-port=9222
```

### Windows

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**Important Notes**:
- Chrome must be started with this flag **before** using the MCP server
- If Chrome is already running, close it completely first and restart with the flag
- Keep this terminal window open while testing
- Chrome will open with a warning banner: "Chrome is being controlled by automated test software"

---

## Step 2: Configure the MCP Server in Claude Code

Add the Chrome DevTools MCP server to your Claude Code configuration file.

### Configuration File Location

The MCP server configuration should be added to your **project-level** `.mcp.json` file or your **global** Claude Code settings.

**Project-level** (recommended for this project):
```
demo/.mcp.json
```

**Global** (applies to all projects):
```
~/.claude/mcp.json
```

### Configuration

Add the following configuration to your `.mcp.json` file:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--browserUrl",
        "http://127.0.0.1:9222"
      ]
    }
  }
}
```

### Configuration Breakdown

| Field | Value | Description |
|-------|-------|-------------|
| `mcpServers` | Object | Root object containing all MCP server configurations |
| `"chrome-devtools"` | Key | Unique identifier for this MCP server |
| `command` | `"npx"` | Command to execute (uses Node Package Execute) |
| `args[0]` | `"-y"` | Auto-accept npx prompts (non-interactive mode) |
| `args[1]` | `"chrome-devtools-mcp@latest"` | Package name and version to run |
| `args[2]` | `"--browserUrl"` | Flag to specify the Chrome debugging URL |
| `args[3]` | `"http://127.0.0.1:9222"` | URL where Chrome is listening for debugging connections |

---

## Step 3: Verify the Configuration

After adding the configuration, verify that Claude Code can connect to the MCP server.

### Check Available MCP Tools

1. Start or restart Claude Code
2. Run `/tools` command to list available tools
3. Look for tools prefixed with `mcp__chrome-devtools__`, such as:
   - `mcp__chrome-devtools__new_page`
   - `mcp__chrome-devtools__take_snapshot`
   - `mcp__chrome-devtools__click`
   - `mcp__chrome-devtools__fill`
   - `mcp__chrome-devtools__navigate_page`
   - And many more...

If these tools appear, the MCP server is configured correctly.

---

## Step 4: Start Your Local Web Server

Before running tests, make sure the demo site is running locally.

```bash
# Navigate to the project directory
cd demo

# Start a local web server
python3 -m http.server 8000
```

The site should be accessible at: **http://localhost:8000**

---

## Step 5: Run Your First Test

Test the setup by asking Claude Code to interact with the demo site:

```
Open http://localhost:8000 in Chrome and take a snapshot of the page
```

Claude Code should:
1. Use `mcp__chrome-devtools__new_page` to open the URL
2. Use `mcp__chrome-devtools__take_snapshot` to capture the page content
3. Show you the page structure

---

## Available MCP Tools

The Chrome DevTools MCP server provides the following categories of tools:

### Navigation & Page Management
- `new_page` - Open a new browser tab with URL
- `navigate_page` - Navigate to URL or go back/forward
- `select_page` - Switch between open tabs
- `close_page` - Close a tab
- `list_pages` - List all open tabs

### Element Interaction
- `click` - Click on elements
- `fill` - Fill input fields
- `fill_form` - Fill multiple form fields at once
- `hover` - Hover over elements
- `press_key` - Send keyboard input
- `drag` - Drag and drop elements
- `upload_file` - Upload files through file inputs

### Page Analysis
- `take_snapshot` - Capture page structure (text-based)
- `take_screenshot` - Capture visual screenshot
- `evaluate_script` - Execute JavaScript in page context
- `wait_for` - Wait for specific text to appear

### Debugging & Monitoring
- `list_console_messages` - View console logs
- `get_console_message` - Get detailed console message
- `list_network_requests` - View network activity
- `get_network_request` - Get detailed request/response data

### Performance & Emulation
- `performance_start_trace` - Start performance recording
- `performance_stop_trace` - Stop and analyze performance
- `performance_analyze_insight` - Get performance insights
- `emulate` - Emulate devices, network conditions, geolocation
- `resize_page` - Change viewport dimensions

### Dialogs
- `handle_dialog` - Accept/dismiss browser alerts and prompts

---

## Troubleshooting

### Issue: MCP server not connecting

**Solution:**
1. Ensure Chrome is running with `--remote-debugging-port=9222`
2. Check that port 9222 is not blocked by firewall
3. Verify the `.mcp.json` configuration is valid JSON
4. Restart Claude Code after configuration changes

### Issue: "Chrome is not responding" errors

**Solution:**
1. Close and restart Chrome with the remote debugging flag
2. Check that only one instance of Chrome is running
3. Try using `http://127.0.0.1:9222` instead of `http://localhost:9222`

### Issue: MCP tools not appearing in Claude Code

**Solution:**
1. Check that `.mcp.json` is in the correct location
2. Restart Claude Code CLI
3. Run `/mcp` command to check MCP server status
4. Check Claude Code logs for configuration errors

### Issue: npx prompts hanging

**Solution:**
- Ensure the `-y` flag is present in the args array
- This flag automatically accepts prompts in non-interactive mode

---

## Testing Workflow

Once the MCP server is configured, follow this workflow:

1. **Start Chrome** with remote debugging
2. **Start local web server** (Python or Node.js)
3. **Launch Claude Code** CLI
4. **Run E2E tests** using the [E2E Test Scenario](e2e-test-scenario.md)

---

## Security Notes

- The remote debugging port (9222) allows **full control** of the browser
- Only use this setup in **development/testing environments**
- Do not expose port 9222 to the internet or untrusted networks
- Close Chrome when testing is complete

---

## Additional Resources

- **Official MCP Server Repo**: [https://github.com/ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- **Chrome DevTools Protocol**: [https://chromedevtools.github.io/devtools-protocol/](https://chromedevtools.github.io/devtools-protocol/)
- **Model Context Protocol**: [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
- **E2E Test Scenario**: [e2e-test-scenario.md](e2e-test-scenario.md)

---