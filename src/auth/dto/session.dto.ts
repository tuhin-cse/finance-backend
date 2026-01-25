import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({ description: 'Device name' })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiPropertyOptional({ description: 'Device ID for tracking' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Location information' })
  @IsString()
  @IsOptional()
  location?: string;
}

export class RevokeSessionDto {
  @ApiProperty({ description: 'Session ID to revoke' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class TrustDeviceDto {
  @ApiProperty({ description: 'Device ID to trust' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({ description: 'Device name' })
  @IsString()
  @IsOptional()
  deviceName?: string;
}
