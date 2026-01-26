
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { EmailService } from '../services/EmailService.js';

const { hash, compare } = bcrypt;

interface ResetToken {
    tokenHash: string;
    expiresAt: Date;
    email: string;
}

// Mock database
const tokenStore: Map<string, ResetToken> = new Map();

export class PasswordResetService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    async requestPasswordReset(email: string): Promise<void> {
        // 1. Generate token
        const token = randomBytes(32).toString('hex');

        // 2. Hash token
        const tokenHash = await hash(token, 10);

        // 3. Store in DB (mocked)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry

        tokenStore.set(email, {
            tokenHash,
            expiresAt,
            email
        });

        // 4. Send email
        await this.emailService.sendPasswordResetEmail(email, token);
    }

    async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
        const record = tokenStore.get(email);

        if (!record) return false;

        // Check expiry
        if (new Date() > record.expiresAt) {
            tokenStore.delete(email);
            return false;
        }

        // Verify token
        const isValid = await compare(token, record.tokenHash);

        // Always remove token after attempt? Or only after success?
        // OWASP: Invalidate after use.
        // If invalid, we probably shouldn't invalidate? 
        // But for security to prevent brute force, verifying against ONE specific hash is key.
        // Since we handle rate limiting elsewhere (middleware), here we just check.
        // If isValid is false, we don't delete token?
        if (!isValid) {
            return false;
        }

        tokenStore.delete(email); // Invalidate after use
        return true;
    }
}

// For testing purposes only
export const _test_clearStore = () => tokenStore.clear();
