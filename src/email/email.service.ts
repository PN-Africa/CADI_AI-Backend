import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is not defined in environment variables.');
    }
    this.resend = new Resend(apiKey || 'API_KEY');
  }

  /**
   * Helper method to generate responsive, bulletproof email HTML structures
   */
  private getEmailTemplate(title: string, bodyText: string, buttonText: string, buttonUrl: string, footerText = ''): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #1f2937;-webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" max-width="570" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 570px; width: 100%;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Cadi AI</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px; line-height: 1.6;">
                    <h2 style="margin-top: 0; margin-bottom: 16px; color: #111827; font-size: 20px; font-weight: 600;">${title}</h2>
                    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px;">${bodyText}</p>
                    
                    <!-- Bulletproof Email Button Wrapper -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                          <a href="${buttonUrl}" target="_blank" style="border: 1px solid #2563eb; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 600; padding: 12px 24px; text-decoration: none; -webkit-text-size-adjust: none; box-sizing: border-box;">
                            ${buttonText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    ${footerText ? `<p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 16px;">\${footerText}</p>` : ''}
                  </td>
                </tr>
                <!-- Footer Info -->
                <tr>
                  <td style="padding: 0 32px 30px 32px; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Cadi AI. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const htmlContent = this.getEmailTemplate(
      'Welcome to Cadi AI',
      'Please click the button below to verify your account and safely access your dashboard.',
      'Verify Account',
      verifyLink
    );

    await this.resend.emails.send({
      from: 'Cadi AI <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your Cadi AI Account',
      html: htmlContent,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/change-password?token=${token}`;

    const htmlContent = this.getEmailTemplate(
      'Password Reset Request',
      'You requested to reset your password. Click the button below to choose a new password. If you did not make this request, you can safely disregard this email.',
      'Change Password',
      resetLink
    );

    await this.resend.emails.send({
      from: 'Cadi AI <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Cadi AI Password',
      html: htmlContent,
    });
  }

  async sendAdminMagicLink(email: string, token: string) {
    const verifyLink = `${process.env.FRONTEND_URL}/admin/verify?token=${token}`;

    const htmlContent = this.getEmailTemplate(
      'Cadi AI Admin Access',
      'A login request was made for the Admin Dashboard using this email address. Click the button below to verify and sign in securely.',
      'Verify & Access Admin Dashboard',
      verifyLink,
      'Note: This link is highly sensitive and will expire in 15 minutes. If you did not request this link, you can safely ignore this email.'
    );

    await this.resend.emails.send({
      from: 'Cadi AI <onboarding@resend.dev>',
      to: email,
      subject: 'Admin Dashboard Login Link',
      html: htmlContent,
    });
  }
}
