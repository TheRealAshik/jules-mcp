
import { Router } from 'express';
import { PasswordResetService } from '../auth/PasswordResetService.js';

const router = Router();
const passwordResetService = new PasswordResetService();

router.post('/password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        await passwordResetService.requestPasswordReset(email);

        // Generic response for security
        res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/password-reset/confirm', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const success = await passwordResetService.resetPassword(email, token, newPassword);

        if (success) {
            res.status(200).json({ message: 'Password reset successfully' });
        } else {
            res.status(400).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
