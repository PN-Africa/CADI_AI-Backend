import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { 
  SignupDto, 
  LoginDto, 
  VerifyEmailDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  AdminLoginDto,
  VerifyAdminTokenDto,
  AdminLoginResponseDto,
  AdminVerifyResponseDto,
  BaseAuthResponseDto, 
  LoginResponseDto     
} from './dto/auth.dto';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new caregiver or healthcare professional' })
  @ApiResponse({ 
    status: 201, 
    description: 'Account created. Verification email sent.',
    type: BaseAuthResponseDto, 
    headers: {
      'Content-Type': {
        description: 'Response content type',
        schema: { type: 'string', example: 'application/json' }
      }
    }
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login using Work Email or Direct Phone' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: LoginResponseDto, // Shows JSON body with userId and role
    headers: {
      'Content-Type': { schema: { type: 'string', example: 'application/json' } }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials or unverified email',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email via token from the email link' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verified successfully. Redirect to dashboard on frontend.',
    type: BaseAuthResponseDto
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link to work email' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reset link sent',
    type: BaseAuthResponseDto
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password using the reset token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully. Redirect to login on frontend.',
    type: BaseAuthResponseDto
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request passwordless magic link for Admin Gmail' })
  @ApiResponse({ 
    status: 200, 
    description: 'Magic link sent to admin email.',
    type: AdminLoginResponseDto 
  })
  @ApiResponse({ status: 403, description: 'Email not in ADMIN_EMAILS list' })
  async requestAdminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.authService.requestAdminLogin(adminLoginDto);
  }

  @Post('admin/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify admin magic link token and issue JWT' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin verified and logged in successfully',
    type: AdminVerifyResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyAdminLogin(@Body() verifyAdminTokenDto: VerifyAdminTokenDto) {
    return this.authService.verifyAdminLogin(verifyAdminTokenDto);
  }
}