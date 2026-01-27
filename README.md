<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@realashik/jules-mcp?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/@realashik/jules-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-SDK-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

</div>


## 🗺️ Navigation

- [📖 Overview](#-overview)
- [🚀 Features](#-features)
- [⚙️ Setup](#-setup)
- [🛠 Development](#-development)
- [📂 Knowledge Base](#-knowledge-base)
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

**Jules MCP** is a Model Context Protocol (MCP) server designed to supercharge AI coding agent to control the **Jules**. While standard AI agents are limited to linear task execution, Jules MCP introduces **Staged Orchestration**—enabling a "Commander" agent to deploy multiple specialized sub-agents (Maestros, Crews, Freelancers) to handle distinct parts of a project simultaneously or in sequence.

Built on top of the **Google Jules API**, it provides the bridge between your IDE and a distributed team of AI workers.

> [!TIP]
> Use IDE agents to analyse and assign tasks to Jules to get best output from this MCP.
---

## 🚀 Features

<details>
<summary><b>Click to expand features list</b></summary>

- **🎭 Multi-Role Orchestration:** Spawn `MAESTRO` (Architect), `CREW` (Implementer), `FREELANCER` (Specialist), or `EVALUATOR` (Quality Control).
- **📝 Staged Workflows:** Automatically manage git branches, code generation, and merging in a single, safe flow.
- **🧠 Global Shared Memory:** Cross-session memory allows workers to pass variables and context like biological collaborators.
- **🛡️ Quality Enforcement:** Built-in review cycles ensure code meets security and performance standards before merging.
- **⚡ Zero Configuration:** Instantly usable via `npx` with automatic environment discovery.
</details>

---

## 🛠 Development

```bash
# 1. Clone the repository
git clone https://github.com/TheRealAshik/jules-mcp.git

# 2. Install dependencies
npm install

# 3. Build & Run
npm run build
npm start
```

---

## 📂 Knowledge Base

- 🔧 **[SKILLS.md](./SKILLS.md)** - Comprehensive tool mapping documentation.
- 🤖 **[SELF_INSTALL.md](./docs/SELF_INSTALL.md)** - Logic for AI agent self-installation.

---

## 🌟 Support

If Jules MCP helps you build faster, please consider:
- ⭐️ **Starring** the [GitHub Repository](https://github.com/TheRealAshik/jules-mcp)
- 👤 **Following** [TheRealAshik](https://github.com/TheRealAshik) for updates.

Developed with ❤️ by **TheRealAshik**
