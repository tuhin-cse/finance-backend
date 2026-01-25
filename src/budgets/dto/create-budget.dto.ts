import {
  IsString,
  IsNumber,
  IsEnum,
  IsDate,
  IsBoolean,
  IsOptional,
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

export class CreateBudgetDto {
  @ApiProperty({ description: 'Category ID' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Budget name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: BudgetType, description: 'Budget type' })
  @IsEnum(BudgetType)
  type: BudgetType;

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

  @ApiPropertyOptional({ description: 'Rollover unused budget to next period' })
  @IsBoolean()
  @IsOptional()
  rolloverUnused?: boolean;

  @ApiPropertyOptional({ description: 'Alert threshold (0.0-1.0)', minimum: 0, maximum: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  alertThreshold?: number;
}
