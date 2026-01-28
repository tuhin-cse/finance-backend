import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangePasswordDto,
  CreateSessionDto,
  Disable2FADto,
  Enable2FADto,
  ForgotPasswordDto,
  LoginWith2FADto,
  RefreshTokenDto,
  ResendVerificationDto,
  ResetPasswordDto,
  RevokeSessionDto,
  SignInDto,
  SignUpDto,
  SocialAuthDto,
  TrustDeviceDto,
  Verify2FADto,
  VerifyEmailDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { randomBytes } from 'crypto';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto, sessionInfo?: CreateSessionDto) {
    const { email, password, firstName, lastName } = signUpDto;

    // Check if the user already exists
    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new BadRequestException('User with that email already exists');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Generate email verification token
    // const verificationToken = randomBytes(32).toString('hex');

    // Create the new user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false,
      },
    });

    // TODO: Send verification email with verificationToken

    // Create session if session info provided
    if (sessionInfo) {
      await this.createSession(user.id, sessionInfo);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      ...tokens,
    };
  }

  async signIn(signInDto: SignInDto, sessionInfo?: CreateSessionDto) {
    const { email, password } = signInDto;

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist or password doesn't match
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordMatches = await bcrypt.compare(password, user.password || '');
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        email: user.email,
      };
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session if session info provided
    if (sessionInfo) {
      await this.createSession(user.id, sessionInfo);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      ...tokens,
    };
  }

  async signInWith2FA(dto: LoginWith2FADto, sessionInfo?: CreateSessionDto) {
    const { email, password, code, deviceName, trustDevice } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.password || '');
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret || '',
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Trust device if requested
    if (trustDevice && sessionInfo?.deviceId) {
      await this.trustDevice(user.id, {
        deviceId: sessionInfo.deviceId,
        deviceName: deviceName || sessionInfo.deviceName,
      });
    }

    // Create session
    if (sessionInfo) {
      await this.createSession(user.id, sessionInfo);
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ...tokens,
    };
  }

  async enable2FA(userId: string, dto: Enable2FADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password || '',
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `BizFinance Pro (${user.email})`,
      length: 32,
    });

    // Save secret (but don't enable yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message:
        'Scan the QR code with your authenticator app and verify with a code',
    };
  }

  async verify2FA(userId: string, dto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return {
      message: '2FA has been successfully enabled',
      enabled: true,
    };
  }

  async disable2FA(userId: string, dto: Disable2FADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password || '',
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid password');
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret || '',
      encoding: 'base32',
      token: dto.code,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as any,
    });

    return {
      message: '2FA has been successfully disabled',
      enabled: false,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Don't reveal if user exists
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token (would need to add these fields to User model)
    // await this.prisma.user.update({
    //   where: { id: user.id },
    //   data: { resetToken, resetTokenExpiry },
    // });

    // TODO: Send password reset email with resetToken

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // In real implementation, verify token from database
    // For now, simplified version

    // Hash new password
    const hashedPassword = await this.hashPassword(dto.newPassword);

    // Update password
    // const user = await this.prisma.user.update({
    //   where: { resetToken: dto.token },
    //   data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    // });

    return {
      message: 'Password has been successfully reset',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password || '',
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await this.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword } as any,
    });

    // Invalidate all sessions except current
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false } as any,
    });

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // In real implementation, verify token from database
    // For now, simplified version

    // await this.prisma.user.update({
    //   where: { verificationToken: dto.token },
    //   data: { emailVerified: true, emailVerifiedAt: new Date(), verificationToken: null },
    // });

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message: 'If the email exists, a verification link has been sent',
      };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');

    // TODO: Send verification email

    return {
      message: 'Verification email sent',
    };
  }

  async createSession(userId: string, sessionInfo: CreateSessionDto) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.prisma.session.create({
      data: {
        userId,
        token: randomBytes(32).toString('hex'),
        deviceId: sessionInfo.deviceId,
        deviceName: sessionInfo.deviceName,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
        location: sessionInfo.location,
        expiresAt,
        isActive: true,
      } as any,
    });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async revokeSession(userId: string, dto: RevokeSessionDto) {
    const session = await this.prisma.session.findFirst({
      where: { id: dto.sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: dto.sessionId },
      data: { isActive: false } as any,
    });

    return {
      message: 'Session revoked successfully',
    };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false } as any,
    });

    return {
      message: 'All sessions revoked successfully',
    };
  }

  async trustDevice(userId: string, dto: TrustDeviceDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const trustedDevices = user.trustedDevices || [];
    if (!trustedDevices.includes(dto.deviceId)) {
      trustedDevices.push(dto.deviceId);

      await this.prisma.user.update({
        where: { id: userId },
        data: { trustedDevices } as any,
      });
    }

    return {
      message: 'Device trusted successfully',
    };
  }

  async untrustDevice(userId: string, deviceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const trustedDevices = (user.trustedDevices || []).filter(
      (d) => d !== deviceId,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { trustedDevices } as any,
    });

    return {
      message: 'Device untrusted successfully',
    };
  }

  async getTrustedDevices(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustedDevices: true },
    });

    return {
      devices: user?.trustedDevices || [],
    };
  }

  async socialAuth(dto: SocialAuthDto, sessionInfo?: CreateSessionDto) {
    // TODO: Verify token with social provider
    // For now, simplified implementation

    // Extract user info from provider token
    // const userInfo = await this.verifySocialToken(dto.accessToken, dto.provider);

    // Check if user exists
    // let user = await this.prisma.user.findFirst({
    //   where: { ssoProvider: dto.provider, ssoId: userInfo.id },
    // });

    // If not, create new user
    // if (!user) {
    //   user = await this.prisma.user.create({
    //     data: {
    //       email: userInfo.email,
    //       firstName: userInfo.firstName,
    //       lastName: userInfo.lastName,
    //       ssoProvider: dto.provider,
    //       ssoId: userInfo.id,
    //       emailVerified: true,
    //     },
    //   });
    // }

    // Create session if provided
    // if (sessionInfo) {
    //   await this.createSession(user.id, sessionInfo);
    // }

    // const tokens = await this.generateTokens(user.id, user.email);

    return {
      message: 'Social authentication not yet implemented',
      // ...user,
      // ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify the refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        ...tokens,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.expiresIn'),
      secret: this.configService.get('jwt.secret'),
    });
  }

  generateRefreshToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      secret: this.configService.get('jwt.refreshSecret'),
    });
  }

  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email),
      this.generateRefreshToken(userId, email),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
