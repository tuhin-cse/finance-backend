import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SocialAuthDto {
  @ApiProperty({ description: 'OAuth access token from social provider' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ description: 'Social provider (google, microsoft, apple)' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional({ description: 'Device name for session tracking' })
  @IsString()
  @IsOptional()
  deviceName?: string;
}
