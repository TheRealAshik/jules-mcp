#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { JulesSDKClient } from './jules-sdk-client.js';
import { WorkerManager } from './worker-manager.js';

// Load environment variables
dotenv.config();

const API_KEY = process.env.JULES_API_KEY;
const BASE_URL = process.env.JULES_API_BASE_URL || 'https://jules.googleapis.com';
const API_VERSION = process.env.JULES_API_VERSION || 'v1alpha';

class JulesMCPServer {
  private server: Server;
  private julesClient: JulesSDKClient | null = null;
  private workerManager: WorkerManager | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'jules-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private async initialize(): Promise<void> {
    if (!API_KEY) {
      console.error('ERROR: JULES_API_KEY environment variable is required');
      console.error('Please set JULES_API_KEY in your MCP configuration');
      return;
    }

    this.julesClient = new JulesSDKClient(API_KEY);
    this.workerManager = new WorkerManager(this.julesClient);
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'jules_create_worker',
            description: 'Create a new Jules worker session for a task',
            inputSchema: {
              type: 'object',
              properties: {
                task_description: {
                  type: 'string',
                  description: 'Description of task for the worker',
                },
                source: {
                  type: 'string',
                  description: 'GitHub source (format: "sources/github/owner/repo")',
                },
                title: {
                  type: 'string',
                  description: 'Short title for the session',
                },
                github_branch: {
                  type: 'string',
                  description: 'Branch to work on (optional, default: "main")',
                  default: 'main',
                },
                role: {
                  type: 'string',
                  description: 'Worker role (MAESTRO, CREW, FREELANCER, EVALUATOR)',
                  default: 'FREELANCER',
                },
                parent_session_id: {
                  type: 'string',
                  description: 'ID of parent worker (if CREW)',
                },
              },
              required: ['task_description', 'source', 'title'],
            },
          },
          {
            name: 'jules_send_message',
            description: 'Send a message to an existing Jules worker session',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Worker session ID',
                },
                message: {
                  type: 'string',
                  description: 'Message text to send',
                },
              },
              required: ['session_id', 'message'],
            },
          },
          {
            name: 'jules_get_activities',
            description: 'Get recent activities for a Jules worker',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Worker session ID',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of activities to return (default: 10)',
                  default: 10,
                },
              },
              required: ['session_id'],
            },
          },
          {
            name: 'jules_stream_activities',
            description: 'Stream real-time activities from a Jules worker session (SDK feature)',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Worker session ID',
                },
                max_activities: {
                  type: 'number',
                  description: 'Maximum number of activities to stream (default: 50)',
                  default: 50,
                },
              },
              required: ['session_id'],
            },
          },
          {
            name: 'jules_estimate_work',
            description: 'Create an Evaluator worker for task estimation',
            inputSchema: {
              type: 'object',
              properties: {
                task_description: {
                  type: 'string',
                  description: 'Description of the task to estimate',
                },
                source: {
                  type: 'string',
                  description: 'GitHub source (format: "sources/github/owner/repo")',
                },
              },
              required: ['task_description', 'source'],
            },
          },
          {
            name: 'jules_store_memory',
            description: 'Store shared memory values for coordination between workers',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Memory key',
                },
                value: {
                  type: 'string',
                  description: 'Value to store',
                },
              },
              required: ['key', 'value'],
            },
          },
          {
            name: 'jules_read_memory',
            description: 'Read shared memory values',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Memory key to read',
                },
              },
              required: ['key'],
            },
          },
          {
            name: 'jules_create_branch',
            description: 'Create a new git branch (essential for Staged Orchestration)',
            inputSchema: {
              type: 'object',
              properties: {
                branch_name: {
                  type: 'string',
                  description: 'Name of the new branch',
                },
                base_branch: {
                  type: 'string',
                  description: 'Base branch to create from (default: "main")',
                  default: 'main',
                },
              },
              required: ['branch_name'],
            },
          },
          {
            name: 'jules_merge_branch',
            description: 'Merge a feature branch into a target branch',
            inputSchema: {
              type: 'object',
              properties: {
                source_branch: {
                  type: 'string',
                  description: 'Branch to merge from',
                },
                target_branch: {
                  type: 'string',
                  description: 'Branch to merge into',
                },
              },
              required: ['source_branch', 'target_branch'],
            },
          },
          {
            name: 'jules_list_branches',
            description: 'List all local branches',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'jules_generate_code',
            description: 'Generate code for specific requirements with context awareness',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Description of the code to generate',
                },
                source: {
                  type: 'string',
                  description: 'GitHub source (format: "sources/github/owner/repo")',
                },
                language: {
                  type: 'string',
                  description: 'Programming language (e.g., typescript, python)',
                },
                context: {
                  type: 'object',
                  description: 'Additional context (key-value pairs)',
                },
              },
              required: ['prompt', 'source', 'language'],
            },
          },
          {
            name: 'jules_fix_bug',
            description: 'Analyze and fix bugs in existing code',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'GitHub source (format: "sources/github/owner/repo")',
                },
                error_description: {
                  type: 'string',
                  description: 'Description of the bug or error',
                },
                expected_behavior: {
                  type: 'string',
                  description: 'Expected behavior after fix',
                },
                code_context: {
                  type: 'string',
                  description: 'Relevant code snippet (optional)',
                },
              },
              required: ['source', 'error_description', 'expected_behavior'],
            },
          },
          {
            name: 'jules_review_code',
            description: 'Comprehensive code review with security and quality assessment',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'GitHub source (format: "sources/github/owner/repo")',
                },
                code: {
                  type: 'string',
                  description: 'Code to review',
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                },
                focus_areas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Areas to focus on (e.g., security, performance, error_handling)',
                },
              },
              required: ['source', 'code', 'language'],
            },
          },
          {
            name: 'jules_delete_worker',
            description: 'Delete a worker session',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Worker session ID to delete',
                },
              },
              required: ['session_id'],
            },
          },
          {
            name: 'jules_get_status',
            description: 'Check worker status and progress',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Worker session ID',
                },
              },
              required: ['session_id'],
            },
          },
          {
            name: 'jules_list_sources',
            description: 'List all available repository sources for Jules',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'jules_create_worker':
            return await this.handleCreateWorker(args);
          case 'jules_send_message':
            return await this.handleSendMessage(args);
          case 'jules_get_activities':
            return await this.handleGetActivities(args);
          case 'jules_stream_activities':
            return await this.handleStreamActivities(args);
          case 'jules_estimate_work':
            return await this.handleEstimateWork(args);
          case 'jules_store_memory':
            return await this.handleStoreMemory(args);
          case 'jules_read_memory':
            return await this.handleReadMemory(args);
          case 'jules_create_branch':
            return await this.handleCreateBranch(args);
          case 'jules_merge_branch':
            return await this.handleMergeBranch(args);
          case 'jules_list_branches':
            return await this.handleListBranches();
          case 'jules_generate_code':
            return await this.handleGenerateCode(args);
          case 'jules_fix_bug':
            return await this.handleFixBug(args);
          case 'jules_review_code':
            return await this.handleReviewCode(args);
          case 'jules_delete_worker':
            return await this.handleDeleteWorker(args);
          case 'jules_get_status':
            return await this.handleGetStatus(args);
          case 'jules_list_sources':
            return await this.handleListSources();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleCreateWorker(args: Record<string, unknown> | undefined) {
    try {
      const schema = z.object({
        task_description: z.string().min(1, 'Task description cannot be empty'),
        source: z.string().regex(/^sources\/github\/[\w-]+\/[\w-]+$/, 'Invalid source format'),
        title: z.string().min(1, 'Title cannot be empty'),
        github_branch: z.string().default('main'),
        role: z.enum(['MAESTRO', 'CREW', 'FREELANCER', 'EVALUATOR']).default('FREELANCER'),
        parent_session_id: z.string().optional(),
      });

      const parsed = schema.parse(args);

      if (!this.workerManager) {
        throw new Error('Worker manager not initialized');
      }

      const sessionId = await this.workerManager.createWorker(
        parsed.task_description,
        parsed.source,
        parsed.title,
        parsed.github_branch,
        parsed.role,
        parsed.parent_session_id
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              session_id: sessionId,
              message: `Worker created successfully. Role: ${parsed.role}. Session ID: ${sessionId}`,
              status: 'success',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMsg = error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Validation error: ${errorMsg}`);
      }
      throw error;
    }
  }

  private async handleSendMessage(args: Record<string, unknown> | undefined) {
    try {
      const schema = z.object({
        session_id: z.string().min(1, 'Session ID cannot be empty'),
        message: z.string().min(1, 'Message cannot be empty'),
      });

      const parsed = schema.parse(args);

      if (!this.workerManager) {
        throw new Error('Worker manager not initialized');
      }

      await this.workerManager.sendMessage(parsed.session_id, parsed.message);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Message sent to worker ${parsed.session_id}`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMsg = error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Validation error: ${errorMsg}`);
      }
      throw error;
    }
  }

  private async handleGetActivities(args: Record<string, unknown> | undefined) {
    try {
      const schema = z.object({
        session_id: z.string().min(1, 'Session ID cannot be empty'),
        limit: z.number().min(1).max(100).default(10),
      });

      const parsed = schema.parse(args);

      if (!this.workerManager) {
        throw new Error('Worker manager not initialized');
      }

      const activities = await this.workerManager.getActivities(parsed.session_id, parsed.limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              session_id: parsed.session_id,
              activities,
              count: activities.length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMsg = error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Validation error: ${errorMsg}`);
      }
      throw error;
    }
  }

  private async handleStreamActivities(args: Record<string, unknown> | undefined) {
    try {
      const schema = z.object({
        session_id: z.string().min(1, 'Session ID cannot be empty'),
        max_activities: z.number().min(1).max(200).default(50),
      });

      const parsed = schema.parse(args);

      if (!this.julesClient) {
        throw new Error('Jules client not initialized');
      }

      const session = this.julesClient.getSessionObject(parsed.session_id);
      const activities = [];
      let count = 0;

      for await (const activity of session.stream()) {
        activities.push({
          type: activity.type,
          id: activity.id,
          createTime: activity.createTime,
          originator: activity.originator,
          data: activity,
        });
        
        count++;
        if (count >= parsed.max_activities) break;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              session_id: parsed.session_id,
              activities,
              count: activities.length,
              streaming: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMsg = error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Validation error: ${errorMsg}`);
      }
      throw error;
    }
  }

  private async handleEstimateWork(args: Record<string, unknown> | undefined) {
    const schema = z.object({
      task_description: z.string().min(1),
      source: z.string().regex(/^sources\/github\/[\w-]+\/[\w-]+$/),
    });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const result = await this.workerManager.estimateWork(parsed.task_description, parsed.source);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', ...result }, null, 2) }],
    };
  }

  private async handleStoreMemory(args: Record<string, unknown> | undefined) {
    const schema = z.object({ key: z.string().min(1), value: z.string() });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    this.workerManager.storeMemory(parsed.key, parsed.value);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', message: `Stored value for key: ${parsed.key}` }, null, 2) }],
    };
  }

  private async handleReadMemory(args: Record<string, unknown> | undefined) {
    const schema = z.object({ key: z.string().min(1) });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const value = this.workerManager.readMemory(parsed.key);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', key: parsed.key, value: value ?? null, found: value !== undefined }, null, 2) }],
    };
  }

  private async handleCreateBranch(args: Record<string, unknown> | undefined) {
    const schema = z.object({ branch_name: z.string().min(1), base_branch: z.string().default('main') });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const result = this.workerManager.createBranch(parsed.branch_name, parsed.base_branch);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: result.success ? 'success' : 'error', ...result }, null, 2) }],
    };
  }

  private async handleMergeBranch(args: Record<string, unknown> | undefined) {
    const schema = z.object({ source_branch: z.string().min(1), target_branch: z.string().min(1) });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const result = this.workerManager.mergeBranch(parsed.source_branch, parsed.target_branch);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: result.success ? 'success' : 'error', ...result }, null, 2) }],
    };
  }

  private async handleListBranches() {
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const branches = this.workerManager.listBranches();
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', branches, count: branches.length }, null, 2) }],
    };
  }

  private async handleGenerateCode(args: Record<string, unknown> | undefined) {
    const schema = z.object({
      prompt: z.string().min(1),
      source: z.string().regex(/^sources\/github\/[\w-]+\/[\w-]+$/),
      language: z.string().min(1),
      context: z.record(z.string()).optional(),
    });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const sessionId = await this.workerManager.generateCode(parsed.prompt, parsed.source, parsed.language, parsed.context);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', session_id: sessionId, message: 'Code generation worker created' }, null, 2) }],
    };
  }

  private async handleFixBug(args: Record<string, unknown> | undefined) {
    const schema = z.object({
      source: z.string().regex(/^sources\/github\/[\w-]+\/[\w-]+$/),
      error_description: z.string().min(1),
      expected_behavior: z.string().min(1),
      code_context: z.string().optional(),
    });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const sessionId = await this.workerManager.fixBug(parsed.source, parsed.error_description, parsed.expected_behavior, parsed.code_context);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', session_id: sessionId, message: 'Bug fix worker created' }, null, 2) }],
    };
  }

  private async handleReviewCode(args: Record<string, unknown> | undefined) {
    const schema = z.object({
      source: z.string().regex(/^sources\/github\/[\w-]+\/[\w-]+$/),
      code: z.string().min(1),
      language: z.string().min(1),
      focus_areas: z.array(z.string()).optional().default(['security', 'quality']),
    });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const sessionId = await this.workerManager.reviewCode(parsed.source, parsed.code, parsed.language, parsed.focus_areas);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', session_id: sessionId, message: 'Code review worker created' }, null, 2) }],
    };
  }

  private async handleDeleteWorker(args: Record<string, unknown> | undefined) {
    const schema = z.object({ session_id: z.string().min(1) });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    await this.workerManager.deleteWorker(parsed.session_id);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', message: `Worker ${parsed.session_id} deleted` }, null, 2) }],
    };
  }

  private async handleGetStatus(args: Record<string, unknown> | undefined) {
    const schema = z.object({ session_id: z.string().min(1) });
    const parsed = schema.parse(args);
    if (!this.workerManager) throw new Error('Worker manager not initialized');

    const worker = await this.workerManager.getWorkerStatus(parsed.session_id);
    if (!worker) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ status: 'error', message: `Worker not found: ${parsed.session_id}` }, null, 2) }],
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', worker }, null, 2) }],
    };
  }

  private async handleListSources() {
    if (!this.workerManager) throw new Error('Worker manager not initialized');
    const sources = await this.workerManager.listSources();
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'success', ...sources }, null, 2) }],
    };
  }

  async run(): Promise<void> {
    await this.initialize();
    console.error('Jules MCP Server initialized successfully');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Jules MCP Server running on stdio');
  }
}

async function main() {
  const server = new JulesMCPServer();
  await server.run();
}

import { fileURLToPath } from 'url';

// ESM equivalent of require.main === module
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { JulesMCPServer };
