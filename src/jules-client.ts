import axios, { AxiosInstance, AxiosError } from 'axios';

export interface SessionRequest {
  prompt: string;
  sourceContext: {
    source: string;
    githubRepoContext: {
      startingBranch: string;
    };
  };
  title: string;
}

export interface SessionResponse {
  name?: string;
  sessionId?: string;
  status?: string;
  state?: string;
  [key: string]: any;
}

export class JulesAPIClient {
  private client: AxiosInstance;

  constructor(
    private apiKey: string,
    private baseUrl: string,
    private apiVersion: string = 'v1alpha'
  ) {
    this.client = axios.create({
      baseURL: `${baseUrl}/${apiVersion}`,
      headers: {
        'X-Goog-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  async listSources(): Promise<any> {
    try {
      const response = await this.client.get('/sources');
      return response.data;
    } catch (error: any) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to list sources (HTTP ${error.response?.status}): ${JSON.stringify(error.response?.data) || error.message}`);
      }
      throw error;
    }
  }

  async createSession(
    prompt: string,
    source: string,
    title: string,
    githubBranch: string = 'main'
  ): Promise<SessionResponse> {
    try {
      const body: SessionRequest = {
        prompt,
        sourceContext: {
          source,
          githubRepoContext: {
            startingBranch: githubBranch,
          },
        },
        title,
      };

      const response = await this.client.post<SessionResponse>('/sessions', body);
      const data = response.data;

      // Google API often returns 'name' as 'sessions/ID'
      if (!data.sessionId && data.name) {
        data.sessionId = data.name.split('/').pop();
      }

      return data;
    } catch (error: any) {
      // ... remaining error handling ...
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your JULES_API_KEY environment variable.');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if ((error.response?.status || 0) >= 500) {
          throw new Error('Jules API service unavailable. Please try again later.');
        }
        const errorMsg = `Failed to create session (HTTP ${error.response?.status || 'unknown'}): ${error.response?.data || error.message}`;
        throw new Error(errorMsg);
      }
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Jules API. Please check your network connection.');
      }
      throw new Error(`Failed to create session: ${String(error)}`);
    }
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    try {
      const response = await this.client.get<SessionResponse>(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error(`Session not found: ${sessionId}`);
        }
        const errorMsg = `Failed to get session (HTTP ${error.response?.status}): ${error.response?.data}`;
        throw new Error(errorMsg);
      }
      throw new Error(`Failed to get session: ${error}`);
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<any> {
    try {
      const response = await this.client.post(`/sessions/${sessionId}/messages`, {
        message,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMsg = `Failed to send message (HTTP ${error.response?.status}): ${error.response?.data}`;
        throw new Error(errorMsg);
      }
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async getActivities(sessionId: string, limit: number = 10): Promise<any> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}/activities`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMsg = `Failed to get activities (HTTP ${error.response?.status}): ${error.response?.data}`;
        throw new Error(errorMsg);
      }
      throw new Error(`Failed to get activities: ${error}`);
    }
  }

  async close(): Promise<void> {
    // Axios doesn't need explicit cleanup like httpx
  }
}
