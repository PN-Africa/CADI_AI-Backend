import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY is not defined in environment variables.');
    }
    
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `\({process.env.FRONTEND_URL}/verify-email?token=\){token}`;
    
    await this.resend.emails.send({
      from: 'Cadi AI ',
      to: email,
      subject: 'Verify your Cadi AI Account',
      html: `Welcome to Cadi AI
Please click the button below to verify your account and access your dashboard.

  [Verify Account](${verifyLink})
`,
});
}

async sendPasswordResetEmail(email: string, token: string) {
const resetLink = `\({process.env.FRONTEND_URL}/change-password?token=\){token}`;

await this.resend.emails.send({
from: 'Cadi AI ',
to: email,
subject: 'Reset your Cadi AI Password',
html: `

Password Reset Request
You requested to reset your password. Click the button below to choose a new password.

    [Change Password](${resetLink})
  `,
});
}
}