<div align="center">
  
[![Deprecated](https://img.shields.io/badge/Status-Deprecated-red?style=flat-square)](https://github.com/TheRealAshik/jules-mcp)
[![Use Instead](https://img.shields.io/badge/Use_Official_SDK-blue?style=flat-square)](https://github.com/google-labs-code/jules-sdk)

</div>

## ⚠️ Deprecated Notice

**Jules MCP** is now deprecated. Google Labs has released their official Jules SDK with native Model Context Protocol (MCP) support, making this community package obsolete.

### 🚀 Recommended Migration

**Use the official package instead:**
```bash
npm install @google/jules-sdk

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@realashik/jules-mcp?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/@realashik/jules-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-SDK-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

</div>


## 🗺️ Navigation

- [📖 Overview](#-overview)
- [⚙️ Setup](#-setup)
- [🚀 Features](#-features)
- [🌟 Support](#-support)

---

## ⚙️ Setup

Choose the installation method that fits your workflow. Both methods require a **Jules API Key**.

> [!IMPORTANT]
> Visit [jules.google.com/settings/api](https://jules.google.com/settings/api) to generate your credentials before proceeding.

<details>
<summary><b>🤖 Method 1: Agent-Driven Install (Recommended)</b></summary>

The fastest way to get started. Copy the block below and paste it into your AI assistant (Antigravity, Cursor, or Claude).

```markdown
Read https://raw.githubusercontent.com/TheRealAshik/jules-mcp/refs/heads/main/docs/AGENT_INSTALL.md and do as per the instructions.
```
</details>

<details>
<summary><b>👤 Method 2: Manual Self-Install</b></summary>

If you prefer to configure the server yourself, follow these steps:

1. **Locate your config file:**
   - **Antigravity:** `~/.gemini/antigravity/mcp_config.json`
   - **Claude Desktop:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Cursor:** Settings > Features > MCP > Add New Server

2. **Add the following snippet:**
```json
{
  "mcpServers": {
    "jules-mcp": {
      "command": "npx",
      "args": ["-y", "@realashik/jules-mcp"],
      "env": {
        "JULES_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```
</details>

---

## 📖 Overview

**Jules MCP** is a Model Context Protocol (MCP) server designed to supercharge AI coding agents to control **Jules**. While standard AI agents are limited to linear task execution, Jules MCP introduces **Staged Orchestration**—enabling a "Commander" agent to deploy multiple specialized sub-agents (Maestros, Crews, Freelancers) to handle distinct parts of a project simultaneously or in sequence.

Built on top of the **official [@google/jules-sdk](https://github.com/google-labs-code/jules-sdk)**, it provides the bridge between your IDE and a distributed team of AI workers with advanced features like real-time streaming, session management, and intelligent caching.

> [!TIP]
> Use IDE agents to analyse and assign tasks to Jules to get best output from this MCP.

> [!NOTE]
> **v1.0.4+** now uses the official Google Jules SDK for improved reliability, streaming support, and better error handling.
---

## 🚀 Features

<details>
<summary><b>Click to expand features list</b></summary>

- **🎭 Multi-Role Orchestration:** Spawn `MAESTRO` (Architect), `CREW` (Implementer), `FREELANCER` (Specialist), or `EVALUATOR` (Quality Control).
- **📝 Staged Workflows:** Automatically manage git branches, code generation, and merging in a single, safe flow.
- **🧠 Global Shared Memory:** Cross-session memory allows workers to pass variables and context like biological collaborators.
- **🛡️ Quality Enforcement:** Built-in review cycles ensure code meets security and performance standards before merging.
- **⚡ Zero Configuration:** Instantly usable via `npx` with automatic environment discovery.
- **🌊 Real-time Streaming:** Stream live activity updates from Jules sessions using the official SDK.
- **🔄 Session Management:** Simplified session lifecycle with automatic polling and state management.
</details>

---

## 🌟 Support

If Jules MCP helps you build faster, please consider:
- ⭐️ **Starring** the [GitHub Repository](https://github.com/TheRealAshik/jules-mcp)
- 👤 **Following** [TheRealAshik](https://github.com/TheRealAshik) for updates.

Developed with ❤️ by **TheRealAshik**
