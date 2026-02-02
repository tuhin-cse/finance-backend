import {
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

export enum GoalType {
  SAVINGS = 'SAVINGS',
  DEBT_PAYOFF = 'DEBT_PAYOFF',
  INVESTMENT = 'INVESTMENT',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  RETIREMENT = 'RETIREMENT',
  OTHER = 'OTHER',
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum ContributionFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum DebtStrategy {
  SNOWBALL = 'SNOWBALL',
  AVALANCHE = 'AVALANCHE',
  CUSTOM = 'CUSTOM',
  HYBRID = 'HYBRID',
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

  @ApiPropertyOptional({
    description: 'Current amount saved',
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentAmount?: number;

  @ApiProperty({ description: 'Target date to achieve goal' })
  @Type(() => Date)
  @IsDate()
  targetDate: Date;

  @ApiPropertyOptional({ description: 'Category ID associated with goal' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Account ID for automatic contributions',
  })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Goal priority (higher = more important)',
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Enable automatic contributions',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoContribute?: boolean;

  @ApiPropertyOptional({
    description: 'Amount to contribute automatically',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  contributionAmount?: number;

  @ApiPropertyOptional({
    enum: ContributionFrequency,
    description: 'Contribution frequency',
  })
  @IsEnum(ContributionFrequency)
  @IsOptional()
  contributionFrequency?: ContributionFrequency;

  @ApiPropertyOptional({
    description: 'Interest rate for debt goals (percentage)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @ApiPropertyOptional({
    enum: DebtStrategy,
    description: 'Debt payoff strategy',
  })
  @IsEnum(DebtStrategy)
  @IsOptional()
  debtStrategy?: DebtStrategy;

  @ApiPropertyOptional({
    description: 'Minimum monthly payment for debt',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPayment?: number;

  @ApiPropertyOptional({
    description: 'Mark goal as shared',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
