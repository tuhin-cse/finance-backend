import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BudgetType {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  ANNUAL = 'ANNUAL',
  QUARTERLY = 'QUARTERLY',
  CUSTOM = 'CUSTOM',
}

export enum BudgetingMethod {
  TRADITIONAL = 'TRADITIONAL',
  ZERO_BASED = 'ZERO_BASED',
  ENVELOPE = 'ENVELOPE',
  FIFTY_THIRTY_TWENTY = 'FIFTY_THIRTY_TWENTY',
  PAY_YOURSELF_FIRST = 'PAY_YOURSELF_FIRST',
  PERCENTAGE_BASED = 'PERCENTAGE_BASED',
}

export class CreateBudgetDto {
  @ApiProperty({ description: 'Budget name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: BudgetType, description: 'Budget type' })
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiPropertyOptional({
    enum: BudgetingMethod,
    description: 'Budgeting methodology',
    default: 'TRADITIONAL',
  })
  @IsEnum(BudgetingMethod)
  @IsOptional()
  budgetingMethod?: BudgetingMethod;

  @ApiProperty({ description: 'Budget amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Period (e.g., YYYY-MM for monthly)' })
  @IsString()
  period: string;

  @ApiProperty({ description: 'Start date' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Category ID (optional for multi-category budgets)',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Rollover unused budget to next period',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  rolloverUnused?: boolean;

  @ApiPropertyOptional({
    description: 'Alert threshold (0.0-1.0)',
    minimum: 0,
    maximum: 1,
    default: 0.8,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  alertThreshold?: number;

  @ApiPropertyOptional({
    description: 'Array of category IDs for multi-category budgets',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Create as template budget',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;

  @ApiPropertyOptional({ description: 'Template ID if created from template' })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Envelope allocated amount (for envelope budgeting)',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  envelopeAllocated?: number;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
