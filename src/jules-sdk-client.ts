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
    try {
      // Parse source format: "sources/github/owner/repo"
      const githubMatch = source.match(/sources\/github\/([^/]+)\/(.+)/);
      if (!githubMatch) {
        throw new Error(`Invalid source format: ${source}. Expected: sources/github/owner/repo`);
      }

      const [, owner, repo] = githubMatch;
      const session = await this.julesClient.session({
        prompt,
        source: { github: `${owner}/${repo}`, baseBranch: githubBranch },
        title,
      });

      return {
        sessionId: session.id,
        name: `sessions/${session.id}`,
        status: 'created',
      };
    } catch (error) {
      if (error instanceof JulesError) {
        throw new Error(`Jules SDK Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SessionInfo> {
    try {
      const session = this.julesClient.session(sessionId);
      const info = await session.info();
      
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
