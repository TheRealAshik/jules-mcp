
export class EmailService {
    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        console.log(`Sending password reset email to ${email} with token ${token}`);
        // In a real implementation this would use nodemailer
    }
}
