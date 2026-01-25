import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDate,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GoalType {
  SAVINGS = 'SAVINGS',
  DEBT_PAYOFF = 'DEBT_PAYOFF',
  INVESTMENT = 'INVESTMENT',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  RETIREMENT = 'RETIREMENT',
  OTHER = 'OTHER',
}

export enum GoalStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export class CreateGoalDto {
  @ApiProperty({ description: 'Goal name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Goal description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: GoalType, description: 'Type of goal' })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiProperty({ description: 'Target amount to achieve', minimum: 0 })
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @ApiPropertyOptional({ description: 'Current amount saved', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentAmount?: number;

  @ApiPropertyOptional({ description: 'Target date to achieve goal' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  targetDate?: Date;

  @ApiPropertyOptional({ description: 'Enable automatic contributions' })
  @IsBoolean()
  @IsOptional()
  autoContribute?: boolean;

  @ApiPropertyOptional({ description: 'Amount to contribute automatically', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  contributionAmount?: number;

  @ApiPropertyOptional({ description: 'Contribution frequency (WEEKLY, MONTHLY, etc.)' })
  @IsString()
  @IsOptional()
  contributionFrequency?: string;
}
