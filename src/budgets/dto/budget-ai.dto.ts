import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BudgetingMethod {
  TRADITIONAL = 'TRADITIONAL',
  ZERO_BASED = 'ZERO_BASED',
  ENVELOPE = 'ENVELOPE',
}

export enum ScenarioType {
  WHAT_IF = 'WHAT_IF',
  BEST_CASE = 'BEST_CASE',
  WORST_CASE = 'WORST_CASE',
  LIKELY = 'LIKELY',
}

export enum CollaboratorRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export class CreateBudgetTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: BudgetingMethod, description: 'Budgeting method' })
  @IsEnum(BudgetingMethod)
  budgetingMethod: BudgetingMethod;

  @ApiProperty({
    description: 'Template categories configuration',
    example: [
      { categoryId: 'uuid', amount: 500, percentage: 20 },
      { categoryId: 'uuid', amount: 1000, percentage: 40 },
    ],
  })
  categories: Array<{
    categoryId: string;
    amount: number;
    percentage: number;
  }>;

  @ApiProperty({ enum: ['MONTHLY', 'WEEKLY', 'ANNUAL', 'QUARTERLY'] })
  @IsString()
  frequency: string;

  @ApiPropertyOptional({ description: 'Make template public for others' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class ApplyBudgetTemplateDto {
  @ApiProperty({ description: 'Template ID to apply' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'Period to apply (e.g., 2026-01)' })
  @IsString()
  period: string;

  @ApiPropertyOptional({ description: 'Adjust amounts by percentage' })
  @IsNumber()
  @IsOptional()
  @Min(-100)
  @Max(100)
  adjustmentPercentage?: number;
}

export class AddBudgetCollaboratorDto {
  @ApiProperty({ description: 'User ID to invite' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: CollaboratorRole, description: 'Collaborator role' })
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;

  @ApiPropertyOptional({ description: 'Can edit budget' })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Can delete budget' })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;

  @ApiPropertyOptional({ description: 'Can invite others' })
  @IsBoolean()
  @IsOptional()
  canInvite?: boolean;
}

export class CreateWhatIfScenarioDto {
  @ApiProperty({ description: 'Scenario name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Scenario description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ScenarioType })
  @IsEnum(ScenarioType)
  scenarioType: ScenarioType;

  @ApiProperty({
    description: 'Scenario assumptions',
    example: {
      income: 5000,
      expenses: { groceries: 500, rent: 1200 },
      oneTimeExpenses: { vacation: 2000 },
    },
  })
  assumptions: Record<string, any>;
}

export class BudgetPerformanceQueryDto {
  @ApiPropertyOptional({ description: 'Start period (YYYY-MM)' })
  @IsString()
  @IsOptional()
  startPeriod?: string;

  @ApiPropertyOptional({ description: 'End period (YYYY-MM)' })
  @IsString()
  @IsOptional()
  endPeriod?: string;

  @ApiPropertyOptional({ description: 'Category ID filter' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: BudgetingMethod })
  @IsEnum(BudgetingMethod)
  @IsOptional()
  budgetingMethod?: BudgetingMethod;
}

export class ForecastExpensesDto {
  @ApiPropertyOptional({ description: 'Number of days to forecast', minimum: 1, maximum: 365 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({ description: 'Category ID to forecast' })
  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class RolloverBudgetDto {
  @ApiProperty({ description: 'Budget ID to rollover' })
  @IsString()
  budgetId: string;

  @ApiProperty({ description: 'Next period (e.g., 2026-02)' })
  @IsString()
  nextPeriod: string;

  @ApiPropertyOptional({ description: 'Adjust amount by percentage' })
  @IsNumber()
  @IsOptional()
  adjustmentPercentage?: number;
}

export class EnvelopeAllocationDto {
  @ApiProperty({ description: 'Total budget amount to allocate' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Envelope allocations',
    example: [
      { categoryId: 'uuid', name: 'Groceries', amount: 500 },
      { categoryId: 'uuid', name: 'Entertainment', amount: 200 },
    ],
  })
  @IsArray()
  envelopes: Array<{
    categoryId: string;
    name: string;
    amount: number;
  }>;

  @ApiProperty({ description: 'Period (YYYY-MM)' })
  @IsString()
  period: string;
}

export class AIRecommendationFeedbackDto {
  @ApiProperty({ description: 'Recommendation ID' })
  @IsString()
  recommendationId: string;

  @ApiProperty({ description: 'Was recommendation accepted' })
  @IsBoolean()
  isAccepted: boolean;

  @ApiPropertyOptional({ description: 'User feedback' })
  @IsString()
  @IsOptional()
  feedback?: string;
}
