# 🏗 Architecture Overview

The Jules MCP Server acts as a bridge between the **Model Context Protocol (MCP)** and the **Google Jules API**. It implements a sophisticated orchestration layer that manages multi-agent lifecycles.

## 🌉 The Bridge Pattern
The server takes incoming JSON-RPC requests from MCP clients (like Antigravity or Claude) and translates them into structured Jules API calls.

## 🧩 Key Components

### 1. `WorkerManager` (`src/worker-manager.ts`)
The core orchestrator.
- **Worker Registry:** Tracks all active `WorkerSession` instances.
- **Role Injection:** Dynamically pre-pends specialized role prompts (`MAESTRO`, `EVALUATOR`, etc.) to task descriptions.
- **Git Simulation:** Manages a conceptual branch state to allow for staged orchestration.

### 2. `JulesAPIClient` (`src/jules-client.ts`)
A robust, error-resilient HTTP client.
- **Retry Logic:** Handles common API failures.
- **Type Safety:** Strong TypeScript interfaces for all Jules API entities.

### 3. `MCPServer` (`src/index.ts`)
The interface layer.
- **Tool definitions:** Exposes 14 distinct tools.
- **Validation:** Uses `zod` for strict runtime schema validation of input arguments.

## 🔄 Data Flow
1. **MCP Client** calls `jules_create_worker`.
2. **index.ts** validates input and calls `WorkerManager`.
3. **WorkerManager** selects the appropriate role prompt and calls `JulesAPIClient`.
4. **JulesAPIClient** communicates with `https://jules.googleapis.com`.
5. **WorkerManager** records the new session ID and returns it to the client.

---

## 💾 Shared Memory Persistence
Currently, `memoryStore` is transient (in-memory). Future architectural updates will include:
- Redis/SQLite persistence for long-running orchestration.
- Cross-session memory recovery on server restart.

---
© 2026 realashik. All rights reserved.
