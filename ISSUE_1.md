# ISSUE_1: Local Development Version Running Instead of NPM Package

## Problem Summary
The jules-mcp MCP server is running from the local development directory (`/home/access_aipro/jules-mcp/dist/index.js`) instead of the published npm package (`@realashik/jules-mcp@latest`).

## Current Status (2026-02-06 13:50 UTC)
- ✅ NPX cache cleared: `rm -rf ~/.npm/_npx`
- ✅ MCP config updated to use: `npx -y @realashik/jules-mcp@1.1.3`
- ⏳ Awaiting Kiro CLI restart to test
- 📝 Context preserved for post-restart verification

## Root Cause
The Kiro CLI MCP configuration file at `/home/access_aipro/.kiro/settings/mcp.json` is configured to run the local build:

```json
{
  "mcpServers": {
    "jules-mcp": {
      "command": "node",
      "args": ["/home/access_aipro/jules-mcp/dist/index.js"],
      "env": {
        "JULES_API_KEY": "AQ.Ab8RN6IqtPHc7sBlikzSZctnxFgmMM6--JmUg19rhvVtm4DXZw"
      }
    }
  }
}
```

## Evidence
1. **Running Processes**: Two instances of the local version are running:
   - PID 3509: `node /home/access_aipro/jules-mcp/dist/index.js`
   - PID 6617: `node /home/access_aipro/jules-mcp/dist/index.js`

2. **Package Info**: Local package version is `1.1.3` (from package.json)

3. **Global Installation**: No global npm installation found (empty)

4. **Config Location**: Kiro CLI uses `/home/access_aipro/.kiro/settings/mcp.json`

## Expected Configuration (Per AGENT_INSTALL.md)
According to the installation documentation, the config should use npx to run the latest published package:

```json
{
  "mcpServers": {
    "jules-mcp": {
      "command": "npx",
      "args": ["-y", "@realashik/jules-mcp@latest"],
      "env": {
        "JULES_API_KEY": "AQ.Ab8RN6IqtPHc7sBlikzSZctnxFgmMM6--JmUg19rhvVtm4DXZw"
      }
    }
  }
}
```

## Impact
- Users are testing against local development code instead of the published package
- Changes made locally are immediately reflected without going through npm publish
- This is appropriate for development but not for production usage testing

## Resolution Options

### Option 1: Switch to NPM Package (Recommended for Testing)
Update `/home/access_aipro/.kiro/settings/mcp.json` to use the published package:
```bash
# Update config to use npx with @latest tag
# Restart Kiro CLI to pick up changes
```

### Option 2: Keep Local Development Setup (Recommended for Development)
Keep current configuration if actively developing the MCP server. This allows:
- Immediate testing of code changes
- Debugging with local source code
- No need to publish to npm for every test

## Additional Context
- **Environment**: Linux system with Node.js v24.12.0
- **Working Directory**: `/home/access_aipro/jules-mcp`
- **Git Status**: Clean working tree, up to date with origin/main
- **Active Rebase**: Git rebase in progress (editor open on rebase-todo)

## Root Cause Analysis

### Primary Issue: MCP Initialization Failure
When using `npx @realashik/jules-mcp@latest`, the MCP server fails to initialize with error:
```
connection closed: initialize response
```

### Investigation Findings

1. **NPM Package Version Mismatch**:
   - Latest published: `1.1.3`
   - Cached in npx: `1.1.0` (at `~/.npm/_npx/e39f3257985fd7b9/`)
   - Local development: `1.1.3`

2. **Code Differences Between Versions**:
   The npm cached version (1.1.0) has different error handling:
   
   **NPM v1.1.0** (fails):
   ```javascript
   if (!API_KEY) {
       throw new Error('JULES_API_KEY environment variable is required');
   }
   ```
   
   **Local v1.1.3** (works):
   ```javascript
   if (!API_KEY) {
       console.error('ERROR: JULES_API_KEY environment variable is required');
       console.error('Please set JULES_API_KEY in your MCP configuration');
       return;
   }
   ```

3. **MCP Protocol Behavior**:
   - When the npm package throws an error during initialization, it exits before responding to the MCP `initialize` request
   - This causes Kiro CLI to report "connection closed: initialize response"
   - The local version gracefully handles missing API keys by logging and continuing

4. **NPX Cache Issue**:
   - NPX cached an older version (1.1.0) despite `@latest` tag
   - Cache location: `~/.npm/_npx/`
   - Multiple cache entries exist from different attempts

## Resolution Steps

### Immediate Fix: Clear NPX Cache
The npx cache has stale v1.1.0. Clear it and force download of latest (v2.0.0):
```bash
rm -rf ~/.npm/_npx
```

Then restart Kiro CLI to trigger fresh download.

### Update MCP Config (Use v1.1.3)
To explicitly use v1.1.3 (matches local):
```json
{
  "mcpServers": {
    "jules-mcp": {
      "command": "npx",
      "args": ["-y", "@realashik/jules-mcp@1.1.3"],
      "env": {
        "JULES_API_KEY": "AQ.Ab8RN6IqtPHc7sBlikzSZctnxFgmMM6--JmUg19rhvVtm4DXZw"
      }
    }
  }
}
```

### Verify Latest Version
Published versions available:
- v2.0.0 (not using)
- **v1.1.3** ✓ (target version)
- Local: v1.1.3 ✓
- Cached: v1.1.0 (stale, cleared)

## Recommendation
1. **Clear npx cache** ✓ Done: `rm -rf ~/.npm/_npx`
2. **Use v1.1.3 explicitly** in MCP config
3. **Restart Kiro CLI** to download v1.1.3
4. **Keep local config for development** since this is the source repository
