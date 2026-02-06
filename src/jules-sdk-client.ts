import { jules, JulesError } from '@google/jules-sdk';

export interface SessionOptions {
  prompt: string;
  source: string;
  title: string;
  githubBranch?: string;
}

export interface SessionInfo {
  sessionId: string;
  status?: string;
  state?: string;
  [key: string]: any;
}

export class JulesSDKClient {
  private julesClient: typeof jules;

  constructor(apiKey: string) {
    this.julesClient = jules.with({ apiKey });
  }

  async createSession(
    prompt: string,
    source: string,
    title: string,
    githubBranch: string = 'main'
  ): Promise<SessionInfo> {
    // Parse source format: "sources/github/owner/repo"
    const githubMatch = source.match(/sources\/github\/([^/]+)\/(.+)/);
    if (!githubMatch) {
      throw new Error(`Invalid source format: ${source}. Expected: sources/github/owner/repo`);
    }

    const [, owner, repo] = githubMatch;
    
    // Retry logic for session creation
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const session = await this.julesClient.session({
          prompt,
          source: { github: `${owner}/${repo}`, baseBranch: githubBranch },
          title,
        });

        // Verify session was created successfully
        if (!session || !session.id) {
          throw new Error('Session created but no ID returned');
        }

        return {
          sessionId: session.id,
          name: `sessions/${session.id}`,
          status: 'created',
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
    }

    if (lastError instanceof JulesError) {
      throw new Error(`Jules SDK Error after 3 attempts: ${lastError.message}`);
    }
    throw lastError || new Error('Failed to create session after 3 attempts');
  }

  async getSession(sessionId: string): Promise<SessionInfo> {
    try {
      const session = this.julesClient.session(sessionId);
      const info = await session.info();
      
      if (!info || !info.id) {
        throw new Error('Invalid session info returned');
      }

      return {
        sessionId: info.id,
        status: info.state,
        state: info.state,
        name: info.name,
        title: info.title,
      };
    } catch (error) {
      if (error instanceof JulesError) {
        throw new Error(`Jules SDK Error: ${error.message}`);
      }
      throw error;
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<any> {
    try {
      const session = this.julesClient.session(sessionId);
      await session.send(message);
      return { success: true };
    } catch (error) {
      if (error instanceof JulesError) {
        throw new Error(`Jules SDK Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getActivities(sessionId: string, limit: number = 10): Promise<any> {
    try {
      const session = this.julesClient.session(sessionId);
      const activities = [];
      
      for await (const activity of session.history()) {
        activities.push(activity);
        if (activities.length >= limit) break;
      }

      return { activities };
    } catch (error) {
      if (error instanceof JulesError) {
        throw new Error(`Jules SDK Error: ${error.message}`);
      }
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    // SDK doesn't expose delete directly, but we can track this
    // The session will be cleaned up by the API
    // For now, this is a no-op as SDK manages lifecycle
  }

  async listSources(): Promise<any> {
    try {
      const sources = [];
      for await (const source of this.julesClient.sources()) {
        sources.push(source);
      }
      return { sources };
    } catch (error) {
      if (error instanceof JulesError) {
        throw new Error(`Jules SDK Error: ${error.message}`);
      }
      throw error;
    }
  }

  getSessionObject(sessionId: string) {
    return this.julesClient.session(sessionId);
  }
}
