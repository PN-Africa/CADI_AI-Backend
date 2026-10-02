var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
let EmailService = class EmailService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    async sendVerificationEmail(email, token) {
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
    async sendPasswordResetEmail(email, token) {
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
};
EmailService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], EmailService);
export { EmailService };
