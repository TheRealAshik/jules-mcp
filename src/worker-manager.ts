import { JulesAPIClient } from './jules-client.js';

export enum WorkerRole {
  MAESTRO = 'MAESTRO',
  CREW = 'CREW',
  FREELANCER = 'FREELANCER',
  EVALUATOR = 'EVALUATOR',
}

export interface WorkerSession {
  sessionId: string;
  title: string;
  role: WorkerRole;
  parentSessionId?: string;
  status: string;
  createdAt: Date;
  lastActivity?: Date;
}

export interface Activity {
  id: string;
  type: string;
  originator: string;
  createTime: string;
  title: string;
  description?: string;
}

const ROLE_PROMPTS = {
  [WorkerRole.MAESTRO]: `
[SYSTEM: ROLE INSTRUCTIONS]
You are a MAESTRO.
Your goal is to plan, prioritize, and manage the execution of a complex task.

**ORCHESTRATION PROTOCOL (CRITICAL):**
1. **Analyze Dependencies**: Identify independent vs. dependent subtasks.
2. **Group & Sequence**: Create a staged execution plan.
3. **Branching Strategy**: Maintain integration branches and assign Crew branches.
4. **Execution Loop**: Create, spawn, wait, verify, and merge.

You must interface with the human user for major decisions.
`,
  [WorkerRole.CREW]: `
[SYSTEM: ROLE INSTRUCTIONS]
You are a CREW member.
You report to a Maestro (Session ID: {parent_id}).
Your goal is to execute the specific task assigned to you.
You must report your progress and any blockers to the Maestro.
`,
  [WorkerRole.EVALUATOR]: `
[SYSTEM: ROLE INSTRUCTIONS]
You are an EVALUATOR.
Your goal is to analyze the task and estimate the effort, complexity, and approach required.
Do not implement the solution yet. Provide a detailed estimation and risk assessment.
`,
  [WorkerRole.FREELANCER]: `
[SYSTEM: ROLE INSTRUCTIONS]
You are a generic worker (Freelancer).
Execute the task as described.
`,
};

export class WorkerManager {
  private workers: Map<string, WorkerSession> = new Map();
  private memoryStore: Map<string, string> = new Map();

  constructor(private julesClient: JulesAPIClient) { }

  async createWorker(
    prompt: string,
    source: string,
    title: string,
    githubBranch: string = 'main',
    role: string = 'FREELANCER',
    parentSessionId?: string
  ): Promise<string> {
    // Validate role
    const roleEnum = Object.values(WorkerRole).includes(role as WorkerRole)
      ? (role as WorkerRole)
      : WorkerRole.FREELANCER;

    // Inject role prompt
    let rolePrompt = ROLE_PROMPTS[roleEnum];
    if (roleEnum === WorkerRole.CREW && parentSessionId) {
      rolePrompt = rolePrompt.replace('{parent_id}', parentSessionId);
    }

    const fullPrompt = `${rolePrompt}\n\n[TASK DESCRIPTION]\n${prompt}`;

    // Create session via Jules API
    const response = await this.julesClient.createSession(
      fullPrompt,
      source,
      title,
      githubBranch
    );

    const sessionId = response.sessionId || 'unknown-session';

    // Track worker
    const worker: WorkerSession = {
      sessionId: sessionId,
      title,
      role: roleEnum,
      parentSessionId,
      status: response.status || 'created',
      createdAt: new Date(),
    };

    this.workers.set(sessionId, worker);

    return sessionId;
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    const worker = this.workers.get(sessionId);
    if (!worker) {
      throw new Error(`Worker not found: ${sessionId}`);
    }

    await this.julesClient.sendMessage(sessionId, message);

    // Update last activity
    worker.lastActivity = new Date();
  }

  async getActivities(sessionId: string, limit: number = 10): Promise<Activity[]> {
    const worker = this.workers.get(sessionId);
    if (!worker) {
      throw new Error(`Worker not found: ${sessionId}`);
    }

    const response = await this.julesClient.getActivities(sessionId, limit);

    // Update last activity
    worker.lastActivity = new Date();

    // Transform response to Activity format
    if (response.activities && Array.isArray(response.activities)) {
      return response.activities.map((activity: any) => ({
        id: activity.id || '',
        type: activity.type || 'unknown',
        originator: activity.originator || 'system',
        createTime: activity.create_time || activity.createTime || new Date().toISOString(),
        title: activity.title || '',
        description: activity.description || '',
      }));
    }

    return [];
  }

  async getWorkerStatus(sessionId: string): Promise<WorkerSession | null> {
    const worker = this.workers.get(sessionId);
    if (!worker) {
      return null;
    }

    try {
      // Get latest status from Jules API
      const response = await this.julesClient.getSession(sessionId);
      worker.status = response.status || worker.status;
      worker.lastActivity = new Date();
    } catch (error) {
      console.error(`Failed to get status for worker ${sessionId}:`, error);
    }

    return worker;
  }

  getAllWorkers(): WorkerSession[] {
    return Array.from(this.workers.values());
  }

  // Memory store methods for coordination
  storeMemory(key: string, value: string): void {
    this.memoryStore.set(key, value);
  }

  readMemory(key: string): string | undefined {
    return this.memoryStore.get(key);
  }

  listMemoryKeys(): string[] {
    return Array.from(this.memoryStore.keys());
  }

  // Estimate work for a task (creates an EVALUATOR worker)
  async estimateWork(
    taskDescription: string,
    source: string
  ): Promise<{ sessionId: string; estimationType: string }> {
    const sessionId = await this.createWorker(
      `Analyze and estimate the following task. Provide effort estimation, complexity assessment, and recommended approach:\n\n${taskDescription}`,
      source,
      'Task Estimation',
      'main',
      'EVALUATOR'
    );
    return {
      sessionId,
      estimationType: 'EVALUATOR',
    };
  }

  // Generate code based on requirements
  async generateCode(
    prompt: string,
    source: string,
    language: string,
    context?: Record<string, string>
  ): Promise<string> {
    const contextStr = context
      ? Object.entries(context)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')
      : '';

    const fullPrompt = `Generate ${language} code for the following requirements:

${prompt}

${contextStr ? `Context:\n${contextStr}` : ''}

Requirements:
- Follow best practices for ${language}
- Include proper error handling
- Add inline documentation
- Make the code production-ready`;

    const sessionId = await this.createWorker(
      fullPrompt,
      source,
      `Code Generation: ${prompt.substring(0, 50)}...`,
      'main',
      'FREELANCER'
    );

    return sessionId;
  }

  // Fix bugs in existing code
  async fixBug(
    source: string,
    errorDescription: string,
    expectedBehavior: string,
    codeContext?: string
  ): Promise<string> {
    const prompt = `Fix the following bug:

Error Description: ${errorDescription}

Expected Behavior: ${expectedBehavior}

${codeContext ? `Code Context:\n\`\`\`\n${codeContext}\n\`\`\`` : ''}

Requirements:
- Identify the root cause
- Implement a fix
- Ensure no regression
- Add tests for the fix`;

    const sessionId = await this.createWorker(
      prompt,
      source,
      `Bug Fix: ${errorDescription.substring(0, 50)}...`,
      'main',
      'FREELANCER'
    );

    return sessionId;
  }

  // Review code for quality and security
  async reviewCode(
    source: string,
    codeToReview: string,
    language: string,
    focusAreas: string[]
  ): Promise<string> {
    const prompt = `Review the following ${language} code:

\`\`\`${language}
${codeToReview}
\`\`\`

Focus Areas: ${focusAreas.join(', ')}

Provide assessment on:
- Code quality and maintainability
- Security vulnerabilities
- Performance considerations
- Best practices adherence
- Suggested improvements`;

    const sessionId = await this.createWorker(
      prompt,
      source,
      `Code Review: ${language}`,
      'main',
      'EVALUATOR'
    );

    return sessionId;
  }

  // Git branch operations (simulated - actual git operations would need execSync)
  private branches: Set<string> = new Set(['main']);

  createBranch(branchName: string, baseBranch: string = 'main'): { success: boolean; message: string } {
    if (this.branches.has(branchName)) {
      return { success: false, message: `Branch '${branchName}' already exists` };
    }
    if (!this.branches.has(baseBranch)) {
      return { success: false, message: `Base branch '${baseBranch}' does not exist` };
    }
    this.branches.add(branchName);
    return { success: true, message: `Branch '${branchName}' created from '${baseBranch}'` };
  }

  mergeBranch(sourceBranch: string, targetBranch: string): { success: boolean; message: string } {
    if (!this.branches.has(sourceBranch)) {
      return { success: false, message: `Source branch '${sourceBranch}' does not exist` };
    }
    if (!this.branches.has(targetBranch)) {
      return { success: false, message: `Target branch '${targetBranch}' does not exist` };
    }
    // In a real implementation, this would perform actual git merge
    return { success: true, message: `Branch '${sourceBranch}' merged into '${targetBranch}'` };
  }

  listBranches(): string[] {
    return Array.from(this.branches);
  }

  deleteBranch(branchName: string): { success: boolean; message: string } {
    if (branchName === 'main') {
      return { success: false, message: "Cannot delete 'main' branch" };
    }
    if (!this.branches.has(branchName)) {
      return { success: false, message: `Branch '${branchName}' does not exist` };
    }
    this.branches.delete(branchName);
    return { success: true, message: `Branch '${branchName}' deleted` };
  }

  async listSources(): Promise<any> {
    return await this.julesClient.listSources();
  }
}
