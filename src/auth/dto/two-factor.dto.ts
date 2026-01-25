import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Enable2FADto {
  @ApiProperty({ description: 'User password for verification' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class Verify2FADto {
  @ApiProperty({ description: '6-digit 2FA code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class Disable2FADto {
  @ApiProperty({ description: 'User password for verification' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: '6-digit 2FA code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class LoginWith2FADto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: '6-digit 2FA code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Device name for trusted device' })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiPropertyOptional({ description: 'Trust this device for 30 days' })
  @IsOptional()
  trustDevice?: boolean;
}
