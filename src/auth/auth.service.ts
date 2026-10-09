import { 
  BadRequestException, 
  Injectable, 
  UnauthorizedException, 
  ForbiddenException, 
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { 
  SignupDto, 
  LoginDto, 
  VerifyEmailDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  AdminLoginDto, 
  VerifyAdminTokenDto 
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private supabase!: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private emailService: EmailService,
    private jwtService: JwtService
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('SUPABASE_URL or SUPABASE_KEY is missing in environment variables.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async signup(data: SignupDto) {
    if (!data.email && !data.phone) {
      throw new BadRequestException('You must provide either a work email or direct phone number');
    }
    
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const cleanEmail = data.email ? data.email.trim().toLowerCase() : null;
    const cleanPhone = data.phone ? data.phone.trim() : null;

    let query = this.supabase.from('users').select('id');
    if (cleanEmail && cleanPhone) {
      query = query.or(`email.ilike.${cleanEmail},phone.eq.${cleanPhone}`);
    } else if (cleanEmail) {
      query = query.ilike('email', cleanEmail);
    } else if (cleanPhone) {
      query = query.eq('phone', cleanPhone);
    }

    const { data: existingUser, error: findError } = await query.maybeSingle();

    if (findError) {
      this.logger.error(`Error checking existing user: ${findError.message}`);
    }

    if (existingUser) {
      throw new BadRequestException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const { data: user, error } = await this.supabase
      .from('users')
      .insert({
        role: data.role,
        email: cleanEmail,
        phone: cleanPhone,
        medical_license_id: data.medicalLicenseId,
        password: hashedPassword,
        verification_token: verificationToken,
      })
      .select()
      .single();

    if (error || !user) {
      this.logger.error(`Signup DB Insert Error: ${error?.message}`);
      throw new BadRequestException(`Failed to create user: ${error?.message || 'Unknown error'}`);
    }

    if (user.email) {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    }

    return { message: 'Account created successfully. Please check your email to verify your account.' };
  }

  async login(data: LoginDto) {
    const cleanIdentifier = data.identifier.trim().toLowerCase();
    const rawIdentifier = data.identifier.trim();

    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${cleanIdentifier},phone.eq.${rawIdentifier}`)
      .maybeSingle();

    if (error) {
      this.logger.error(`Login DB Query Error: ${error.message}`);
      throw new UnauthorizedException('Database query failed during authentication');
    }

    if (!user) {
      this.logger.warn(`Login failed: No user found for ${cleanIdentifier}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Password mismatch for ${cleanIdentifier}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_email_verified && user.email) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      userId: user.id,
      role: user.role,
      accessToken,
    };
  }

  async verifyEmail(data: VerifyEmailDto) {
    const { data: user, error: findError } = await this.supabase
      .from('users')
      .select('*')
      .eq('verification_token', data.token)
      .maybeSingle();

    if (findError || !user) {
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
      this.logger.error(`Email verification DB Error: ${error.message}`);
      throw new BadRequestException('Failed to verify email');
    }

    return { message: 'Email verified successfully. You can now access your dashboard.' };
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const cleanEmail = data.email.trim().toLowerCase();

    const { data: user } = await this.supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!user?.email) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = randomBytes(32).toString('hex');

    const { error } = await this.supabase
      .from('users')
      .update({ reset_password_token: resetToken })
      .eq('id', user.id);

    if (error) {
      this.logger.error(`Forgot Password Token Update Error: ${error.message}`);
    } else {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  async resetPassword(data: ResetPasswordDto) {
    const { data: user, error: findError } = await this.supabase
      .from('users')
      .select('*')
      .eq('reset_password_token', data.token)
      .maybeSingle();

    if (findError || !user) {
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
      this.logger.error(`Reset Password DB Error: ${error.message}`);
      throw new BadRequestException('Failed to reset password');
    }

    return { message: 'Password changed successfully. You can now log in.' };
  }

  async requestAdminLogin(data: AdminLoginDto) {
    const allowedEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    const inputEmail = data.email.trim().toLowerCase();

    if (!allowedEmails.includes(inputEmail)) {
      throw new ForbiddenException('Unauthorized: Email is not registered as an Admin');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Uses admin_users table
    const { error } = await this.supabase
      .from('admin_users')
      .insert({
        email: inputEmail,
        token,
        expires_at: expiresAt,
      });

    if (error) {
      this.logger.error(`Request Admin Login DB Error: ${error.message}`);
      throw new BadRequestException(`Failed to generate admin token: ${error.message}`);
    }

    await this.emailService.sendAdminMagicLink(inputEmail, token);

    return { message: 'Verification link sent to your admin email.' };
  }

  async verifyAdminLogin(data: VerifyAdminTokenDto) {
    // Uses admin_users table
    const { data: adminToken, error: findError } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('token', data.token)
      .maybeSingle();

    if (findError || !adminToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (new Date(adminToken.expires_at) < new Date()) {
      await this.supabase.from('admin_users').delete().eq('id', adminToken.id);
      throw new BadRequestException('Verification token has expired');
    }

    await this.supabase.from('admin_users').delete().eq('id', adminToken.id);

    const payload = { email: adminToken.email, role: 'ADMIN' };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Admin authentication successful',
      role: 'ADMIN',
      accessToken,
    };
  }
}