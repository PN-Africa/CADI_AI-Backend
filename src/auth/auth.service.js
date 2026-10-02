var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';
loadEnv();
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
let AuthService = class AuthService {
    constructor(emailService) {
        this.emailService = emailService;
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }
    async signup(data) {
        if (!data.email && !data.phone) {
            throw new BadRequestException('You must provide either a work email or direct phone number');
        }
        if (data.password !== data.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }
        // Build conditional query for checking existing user
        let query = this.supabase.from('users').select('id');
        if (data.email && data.phone) {
            query = query.or(`email.eq.\({data.email},phone.eq.\){data.phone}`);
        }
        else if (data.email) {
            query = query.eq('email', data.email);
        }
        else if (data.phone) {
            query = query.eq('phone', data.phone);
        }
        const { data: existingUser } = await query.maybeSingle();
        if (existingUser) {
            throw new BadRequestException('User with this email or phone already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const verificationToken = randomBytes(32).toString('hex');
        const { data: user, error } = await this.supabase
            .from('users')
            .insert({
            role: data.role,
            email: data.email,
            phone: data.phone,
            medical_license_id: data.medicalLicenseId,
            password: hashedPassword,
            verification_token: verificationToken,
        })
            .select()
            .single();
        if (error) {
            throw new BadRequestException(`Failed to create user: ${error.message}`);
        }
        // If email is provided, send the verification email
        if (user.email) {
            await this.emailService.sendVerificationEmail(user.email, verificationToken);
        }
        return { message: 'Account created successfully. Please check your email to verify your account.' };
    }
    async login(data) {
        const { data: user } = await this.supabase
            .from('users')
            .select('*')
            .or(`email.eq.\({data.identifier},phone.eq.\){data.identifier}`)
            .maybeSingle();
        if (!user || !(await bcrypt.compare(data.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        if (!user.is_email_verified && user.email) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }
        return {
            message: 'Login successful',
            userId: user.id,
            role: user.role,
        };
    }
    async verifyEmail(data) {
        const { data: user } = await this.supabase
            .from('users')
            .select('*')
            .eq('verification_token', data.token)
            .maybeSingle();
        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }
        const { error } = await this.supabase
            .from('users')
            .update({
            is_email_verified: true,
            verification_token: null,
        })
            .eq('id', user.id);
        if (error) {
            throw new BadRequestException('Failed to verify email');
        }
        return { message: 'Email verified successfully. You can now access your dashboard.' };
    }
    async forgotPassword(data) {
        const { data: user } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', data.email)
            .maybeSingle();
        if (!user?.email) {
            return { message: 'If an account with that email exists, a reset link has been sent.' };
        }
        const resetToken = randomBytes(32).toString('hex');
        await this.supabase
            .from('users')
            .update({ reset_password_token: resetToken })
            .eq('id', user.id);
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);
        return { message: 'If an account with that email exists, a reset link has been sent.' };
    }
    async resetPassword(data) {
        const { data: user } = await this.supabase
            .from('users')
            .select('*')
            .eq('reset_password_token', data.token)
            .maybeSingle();
        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        const { error } = await this.supabase
            .from('users')
            .update({
            password: hashedPassword,
            reset_password_token: null,
        })
            .eq('id', user.id);
        if (error) {
            throw new BadRequestException('Failed to reset password');
        }
        return { message: 'Password changed successfully. You can now log in.' };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EmailService])
], AuthService);
export { AuthService };
