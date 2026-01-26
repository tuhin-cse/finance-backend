import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType, SubscriptionTier } from '@prisma/client';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Organization name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Acme Corp LLC', description: 'Legal business name' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ example: 'LLC', description: 'Business type', enum: BusinessType })
  @IsEnum(BusinessType)
  @IsOptional()
  businessType?: BusinessType;

  @ApiPropertyOptional({ example: 'Technology', description: 'Industry sector' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: '12-3456789', description: 'Tax ID / EIN' })
  @IsString()
  @IsOptional()
  ein?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'Logo URL' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: 'Custom color scheme configuration' })
  @IsObject()
  @IsOptional()
  colorScheme?: any;

  @ApiPropertyOptional({ example: 'business.acme.com', description: 'Custom domain' })
  @IsString()
  @IsOptional()
  customDomain?: string;

  @ApiPropertyOptional({ example: 1, description: 'Fiscal year start month (1-12)', minimum: 1, maximum: 12 })
  @IsNumber()
  @IsOptional()
  fiscalYearStart?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Base currency code' })
  @IsString()
  @IsOptional()
  baseCurrency?: string;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'Timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'PROFESSIONAL', description: 'Subscription tier', enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  @IsOptional()
  subscriptionTier?: SubscriptionTier;
}
