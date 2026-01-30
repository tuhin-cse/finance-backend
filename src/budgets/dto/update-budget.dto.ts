import { PartialType } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';
import {
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @ApiPropertyOptional({ description: 'Amount spent from budget', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  spent?: number;

  @ApiPropertyOptional({
    description: 'Remaining budget amount',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  remaining?: number;

  @ApiPropertyOptional({
    description: 'Variance from planned budget',
  })
  @IsNumber()
  @IsOptional()
  variance?: number;

  @ApiPropertyOptional({
    description: 'Success rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  successRate?: number;

  @ApiPropertyOptional({
    description: 'Average utilization percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  averageUtilization?: number;

  @ApiPropertyOptional({
    description: 'Mark budget as active/inactive',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Mark budget as shared',
  })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @ApiPropertyOptional({
    description: 'Envelope spent amount (for envelope budgeting)',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  envelopeSpent?: number;

  @ApiPropertyOptional({
    description: 'Rollover amount from previous period',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rolloverAmount?: number;
}
