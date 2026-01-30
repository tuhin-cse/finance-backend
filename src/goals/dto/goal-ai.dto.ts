import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DebtStrategy {
  SNOWBALL = 'SNOWBALL',
  AVALANCHE = 'AVALANCHE',
  CUSTOM = 'CUSTOM',
}

export enum ContributionFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  ONE_TIME = 'ONE_TIME',
}

export enum SavingsRuleType {
  ROUND_UP = 'ROUND_UP',
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  CONDITIONAL = 'CONDITIONAL',
  SPARE_CHANGE = 'SPARE_CHANGE',
}

export enum ExecutionFrequency {
  PER_TRANSACTION = 'PER_TRANSACTION',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateGoalMilestoneDto {
  @ApiProperty({ description: 'Goal ID' })
  @IsString()
  goalId: string;

  @ApiProperty({ description: 'Milestone name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Target amount for this milestone', minimum: 0 })
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @ApiPropertyOptional({ description: 'Target date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  targetDate?: Date;

  @ApiProperty({ description: 'Display order', minimum: 1 })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiPropertyOptional({ description: 'XP reward for completing milestone' })
  @IsNumber()
  @IsOptional()
  xpReward?: number;

  @ApiPropertyOptional({ description: 'Badge reward ID' })
  @IsString()
  @IsOptional()
  badgeReward?: string;
}

export class AddGoalContributionDto {
  @ApiProperty({ description: 'Contribution amount', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Contribution note' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: 'Linked transaction ID' })
  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class AddGoalCollaboratorDto {
  @ApiProperty({ description: 'User ID to invite' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: ['OWNER', 'EDITOR', 'VIEWER'] })
  @IsString()
  role: string;

  @ApiPropertyOptional({ description: 'Can contribute to goal' })
  @IsBoolean()
  @IsOptional()
  canContribute?: boolean;

  @ApiPropertyOptional({ description: 'Can edit goal' })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Can delete goal' })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;
}

export class CreateSavingsRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SavingsRuleType, description: 'Type of savings rule' })
  @IsEnum(SavingsRuleType)
  ruleType: SavingsRuleType;

  @ApiPropertyOptional({ description: 'Link to specific goal' })
  @IsString()
  @IsOptional()
  goalId?: string;

  @ApiProperty({
    description: 'Rule configuration',
    example: {
      roundUpTo: 1,
      percentage: 10,
      amount: 50,
      conditions: { minAmount: 10 },
    },
  })
  config: Record<string, any>;

  @ApiProperty({ enum: ExecutionFrequency })
  @IsEnum(ExecutionFrequency)
  frequency: ExecutionFrequency;

  @ApiPropertyOptional({ description: 'Activate rule immediately' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSavingsRuleDto {
  @ApiPropertyOptional({ description: 'Rule name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Rule configuration' })
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Execution frequency' })
  @IsEnum(ExecutionFrequency)
  @IsOptional()
  frequency?: ExecutionFrequency;

  @ApiPropertyOptional({ description: 'Activate/deactivate rule' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SetGoalPriorityDto {
  @ApiProperty({ description: 'Goal ID' })
  @IsString()
  goalId: string;

  @ApiProperty({
    description: 'Priority (higher = more important)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  priority: number;
}

export class SetDebtStrategyDto {
  @ApiProperty({ enum: DebtStrategy })
  @IsEnum(DebtStrategy)
  strategy: DebtStrategy;

  @ApiPropertyOptional({
    description: 'Custom payoff order (array of goal IDs)',
    example: ['goal-id-1', 'goal-id-2', 'goal-id-3'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customOrder?: string[];
}

export class GoalLeaderboardQueryDto {
  @ApiPropertyOptional({ enum: ['week', 'month', 'all-time'] })
  @IsString()
  @IsOptional()
  period?: 'week' | 'month' | 'all-time';

  @ApiPropertyOptional({
    description: 'Number of results',
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GoalAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Goal type filter' })
  @IsString()
  @IsOptional()
  goalType?: string;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class CompleteMilestoneDto {
  @ApiProperty({ description: 'Milestone ID' })
  @IsString()
  milestoneId: string;
}

export class AutoContributeConfigDto {
  @ApiProperty({ description: 'Enable auto-contribute' })
  @IsBoolean()
  autoContribute: boolean;

  @ApiPropertyOptional({ description: 'Contribution amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  contributionAmount?: number;

  @ApiPropertyOptional({ enum: ContributionFrequency })
  @IsEnum(ContributionFrequency)
  @IsOptional()
  contributionFrequency?: ContributionFrequency;

  @ApiPropertyOptional({ description: 'Linked account ID for contributions' })
  @IsString()
  @IsOptional()
  accountId?: string;
}

export class CalculateDebtPayoffDto {
  @ApiProperty({ description: 'Array of debt goal IDs' })
  @IsArray()
  @IsString({ each: true })
  debtGoalIds: string[];

  @ApiProperty({ description: 'Extra monthly payment amount' })
  @IsNumber()
  @Min(0)
  extraPayment: number;

  @ApiPropertyOptional({ enum: DebtStrategy })
  @IsEnum(DebtStrategy)
  @IsOptional()
  strategy?: DebtStrategy;
}
