import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token from email' })
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'New password' })
  @IsNotEmpty()
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsNotEmpty()
  newPassword: string;
}
