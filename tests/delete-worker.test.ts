import { JulesAPIClient } from '../src/jules-client.js';
import { WorkerManager } from '../src/worker-manager.js';

// Mock axios
jest.mock('axios');
import axios, { AxiosError } from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Jules MCP Server - Delete Worker', () => {
    let julesClient: JulesAPIClient;
    let workerManager: WorkerManager;
    const mockApiKey = 'test-api-key';
    const mockBaseUrl = 'https://jules.googleapis.com';
    const mockSessionId = 'test-session-123';

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock axios instance
        const mockAxiosInstance = {
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
        };

        mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

        julesClient = new JulesAPIClient(mockApiKey, mockBaseUrl);
        workerManager = new WorkerManager(julesClient);
    });

    describe('JulesAPIClient.deleteSession', () => {
        it('should successfully delete a session', async () => {
            const mockAxiosInstance = mockedAxios.create();
            (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({ status: 204 });

            await julesClient.deleteSession(mockSessionId);

            expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/sessions/${mockSessionId}`);
        });

        it('should handle 404 error when session not found', async () => {
            const mockAxiosInstance = mockedAxios.create();

            // Create a proper AxiosError-like object
            const error = Object.assign(
                new Error('Request failed with status code 404'),
                {
                    isAxiosError: true,
                    response: {
                        status: 404,
                        data: { error: 'Session not found' },
                        statusText: 'Not Found',
                        headers: {},
                        config: {} as any,
                    },
                    config: {} as any,
                    toJSON: () => ({}),
                }
            );
            Object.setPrototypeOf(error, AxiosError.prototype);

            (mockAxiosInstance.delete as jest.Mock).mockRejectedValue(error);

            await expect(julesClient.deleteSession(mockSessionId)).rejects.toThrow(
                `Session not found: ${mockSessionId}`
            );
        });

        it('should handle other errors', async () => {
            const mockAxiosInstance = mockedAxios.create();

            // Create a proper AxiosError-like object
            const error = Object.assign(
                new Error('Request failed with status code 500'),
                {
                    isAxiosError: true,
                    response: {
                        status: 500,
                        data: { error: 'Internal server error' },
                        statusText: 'Internal Server Error',
                        headers: {},
                        config: {} as any,
                    },
                    config: {} as any,
                    toJSON: () => ({}),
                }
            );
            Object.setPrototypeOf(error, AxiosError.prototype);

            (mockAxiosInstance.delete as jest.Mock).mockRejectedValue(error);

            await expect(julesClient.deleteSession(mockSessionId)).rejects.toThrow(
                'Failed to delete session'
            );
        });
    });

    describe('WorkerManager.deleteWorker', () => {
        it('should delete a worker and remove it from the map', async () => {
            const mockAxiosInstance = mockedAxios.create();

            // Mock createSession
            (mockAxiosInstance.post as jest.Mock).mockResolvedValue({
                data: {
                    sessionId: mockSessionId,
                    name: `sessions/${mockSessionId}`,
                    status: 'active',
                },
            });

            // Create a worker first
            await workerManager.createWorker(
                'Test task',
                'sources/github/test/repo',
                'Test Worker',
                'main',
                'FREELANCER'
            );

            // Verify worker exists
            const workerBefore = await workerManager.getWorkerStatus(mockSessionId);
            expect(workerBefore).toBeTruthy();
            expect(workerBefore?.sessionId).toBe(mockSessionId);

            // Mock deleteSession
            (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({ status: 204 });

            // Delete the worker
            await workerManager.deleteWorker(mockSessionId);

            // Verify worker is deleted
            const workerAfter = await workerManager.getWorkerStatus(mockSessionId);
            expect(workerAfter).toBeNull();
        });

        it('should throw error when deleting non-existent worker', async () => {
            await expect(workerManager.deleteWorker('non-existent-id')).rejects.toThrow(
                'Worker not found: non-existent-id'
            );
        });
    });

    describe('Integration: Create and Delete Worker Flow', () => {
        it('should create and then delete a worker successfully', async () => {
            const mockAxiosInstance = mockedAxios.create();

            // Mock createSession
            (mockAxiosInstance.post as jest.Mock).mockResolvedValue({
                data: {
                    sessionId: mockSessionId,
                    name: `sessions/${mockSessionId}`,
                    status: 'active',
                },
            });

            // Create worker
            const sessionId = await workerManager.createWorker(
                'Test task for integration',
                'sources/github/test/repo',
                'Integration Test Worker',
                'main',
                'FREELANCER'
            );

            expect(sessionId).toBe(mockSessionId);

            // Mock getSession
            (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
                data: {
                    sessionId: mockSessionId,
                    status: 'active',
                },
            });

            // Verify worker exists
            const worker = await workerManager.getWorkerStatus(sessionId);
            expect(worker).toBeTruthy();
            expect(worker?.title).toBe('Integration Test Worker');

            // Mock deleteSession
            (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({ status: 204 });

            // Delete worker
            await workerManager.deleteWorker(sessionId);

            // Verify worker is deleted
            const deletedWorker = await workerManager.getWorkerStatus(sessionId);
            expect(deletedWorker).toBeNull();
        });
    });
});
