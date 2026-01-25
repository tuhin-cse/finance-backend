import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token' })
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
