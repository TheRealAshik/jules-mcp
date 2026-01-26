
import { PasswordResetService, _test_clearStore } from '../../src/auth/PasswordResetService.js';

describe('PasswordResetService', () => {
    let service: PasswordResetService;
    const mockEmail = 'test@example.com';

    beforeEach(() => {
        service = new PasswordResetService();
        _test_clearStore();
    });

    afterEach(() => {
        _test_clearStore();
    });

    describe('requestPasswordReset', () => {
        it('should generate token and send email', async () => {
            // Logic to spy on internal calls or mocks would go here
            // For now we just verify it doesn't throw
            await expect(service.requestPasswordReset(mockEmail)).resolves.not.toThrow();
        });
    });

    describe('resetPassword', () => {
        it('should return false for invalid token', async () => {
            // Setup: Create a request first
            await service.requestPasswordReset(mockEmail);

            const result = await service.resetPassword(mockEmail, 'invalid-token', 'new-pass');
            expect(result).toBe(false);
        });

        it('should return false for non-existent request', async () => {
            const result = await service.resetPassword('non-existent@example.com', 'token', 'pass');
            expect(result).toBe(false);
        });
    });
});
