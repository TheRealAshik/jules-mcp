# 🔧 SKILLS: The Orchestrator's Toolbox

The Jules MCP Server grants you 14 powerful "Skills" (Tools) to manage your AI fleet.

## 🏗 Fleet Orchestration
| Tool | Description | Use Case |
| :--- | :--- | :--- |
| `jules_create_worker` | Spawn a task-specific worker. | When a task needs execution. |
| `jules_send_message` | Send instructions to a worker. | Mid-task corrections. |
| `jules_get_activities`| View the worker's audit trail. | Monitoring background progress. |
| `jules_get_status` | Check if a worker is alive/done. | Workflow synchronization. |

## 💻 Code Intelligence
| Tool | Description | Use Case |
| :--- | :--- | :--- |
| `jules_generate_code` | context-aware code generation. | New feature implementation. |
| `jules_fix_bug` | Automated bug remediation. | Resolving detected errors. |
| `jules_review_code` | Security & quality assessment. | Pre-merge sanity checks. |
| `jules_estimate_work` | Effort & risk estimation. | Initial task scoping. |

## 💾 Collective Memory
| Tool | Description | Use Case |
| :--- | :--- | :--- |
| `jules_store_memory` | Save global variables. | Persisting context between workers. |
| `jules_read_memory` | Retrieve global variables. | Pulling context into a new session. |

## 🌿 Staged Orchestration (Git)
| Tool | Description | Use Case |
| :--- | :--- | :--- |
| `jules_create_branch` | Create a new git branch. | Isolation of feature work. |
| `jules_merge_branch` | Merge results into target. | Completion of a task lifecycle. |
| `jules_list_branches` | View local branch state. | Repository auditing. |

---

## 🔍 Discovery
- `jules_list_sources`: Discover available repositories for Jules to operate on.

---

### 💡 Workflow Archetype: "The Staged Implementation"
1. **Initialize:** `jules_create_branch("feat/analytics")`.
2. **Estimate:** `jules_estimate_work(...)` to confirm approach.
3. **Draft:** `jules_create_worker(...)` as FREELANCER to write code.
4. **Audit:** `jules_review_code(...)` on the generated files.
5. **Finalize:** `jules_merge_branch("feat/analytics", "main")` and delete the branch.
