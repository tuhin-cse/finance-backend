import { Body, Controller, Get, Post, UseGuards, Patch, Delete, Param, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RefreshTokenDto,
  SignInDto,
  SignUpDto,
  TokenResponseDto,
  Enable2FADto,
  Verify2FADto,
  Disable2FADto,
  LoginWith2FADto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  CreateSessionDto,
  RevokeSessionDto,
  TrustDeviceDto,
  SocialAuthDto,
} from './dto';
import { JwtAuthGuard } from './guards';
import { GetUser } from './decorators';
import { User } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully registered',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  signUp(@Body() signUpDto: SignUpDto, @Req() req: Request) {
    const sessionInfo = this.extractSessionInfo(req);
    return this.authService.signUp(signUpDto, sessionInfo);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully authenticated',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  signIn(@Body() signInDto: SignInDto, @Req() req: Request) {
    const sessionInfo = this.extractSessionInfo(req);
    return this.authService.signIn(signInDto, sessionInfo);
  }

  @Post('signin/2fa')
  @ApiOperation({ summary: 'Login with 2FA code' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated with 2FA',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  signInWith2FA(@Body() dto: LoginWith2FADto, @Req() req: Request) {
    const sessionInfo = this.extractSessionInfo(req);
    return this.authService.signInWith2FA(dto, sessionInfo);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New access and refresh tokens generated successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated user profile',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@GetUser() user: User) {
    return user;
  }

  // ========== 2FA Endpoints ==========

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: 'Returns QR code and secret for 2FA setup',
  })
  enable2FA(@GetUser('id') userId: string, @Body() dto: Enable2FADto) {
    return this.authService.enable2FA(userId, dto);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify and complete 2FA setup' })
  @ApiResponse({
    status: 200,
    description: '2FA successfully enabled',
  })
  verify2FA(@GetUser('id') userId: string, @Body() dto: Verify2FADto) {
    return this.authService.verify2FA(userId, dto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: '2FA successfully disabled',
  })
  disable2FA(@GetUser('id') userId: string, @Body() dto: Disable2FADto) {
    return this.authService.disable2FA(userId, dto);
  }

  // ========== Password Management ==========

  @Post('password/forgot')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('password/change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
  })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  changePassword(@GetUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  // ========== Email Verification ==========

  @Post('email/verify')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('email/resend')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
  })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  // ========== Session Management ==========

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all active sessions' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
  })
  getSessions(@GetUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
  })
  revokeSession(
    @GetUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.authService.revokeSession(userId, { sessionId });
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke all sessions' })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
  })
  revokeAllSessions(@GetUser('id') userId: string) {
    return this.authService.revokeAllSessions(userId);
  }

  // ========== Device Trust ==========

  @Post('devices/trust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Trust a device' })
  @ApiResponse({
    status: 200,
    description: 'Device trusted successfully',
  })
  trustDevice(@GetUser('id') userId: string, @Body() dto: TrustDeviceDto) {
    return this.authService.trustDevice(userId, dto);
  }

  @Delete('devices/trust/:deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Untrust a device' })
  @ApiResponse({
    status: 200,
    description: 'Device untrusted successfully',
  })
  untrustDevice(
    @GetUser('id') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.authService.untrustDevice(userId, deviceId);
  }

  @Get('devices/trusted')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get list of trusted devices' })
  @ApiResponse({
    status: 200,
    description: 'List of trusted devices',
  })
  getTrustedDevices(@GetUser('id') userId: string) {
    return this.authService.getTrustedDevices(userId);
  }

  // ========== Social Authentication ==========

  @Post('social')
  @ApiOperation({ summary: 'Authenticate with social provider' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated via social provider',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid social token' })
  socialAuth(@Body() dto: SocialAuthDto, @Req() req: Request) {
    const sessionInfo = this.extractSessionInfo(req);
    return this.authService.socialAuth(dto, sessionInfo);
  }

  // Helper method to extract session info from request
  private extractSessionInfo(req: Request): CreateSessionDto {
    return {
      ipAddress: (req.ip || req.socket.remoteAddress) as string,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string,
      deviceName: req.headers['x-device-name'] as string,
    };
  }
}
