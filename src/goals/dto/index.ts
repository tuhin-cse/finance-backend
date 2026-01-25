import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GoalType } from '@prisma/client';
import { Type } from 'class-transformer';

export * from './create-goal.dto';
export * from './update-goal.dto';

export class CreateGoalDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalType)
  type: GoalType;

  @IsNumber()
  @Min(0)
  targetAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentAmount?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  targetDate?: Date;

  @IsBoolean()
  @IsOptional()
  autoContribute?: boolean;

  @IsNumber()
  @IsOptional()
  contributionAmount?: number;

  @IsString()
  @IsOptional()
  contributionFrequency?: string;
}

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  targetDate?: Date;

  @IsBoolean()
  @IsOptional()
  autoContribute?: boolean;

  @IsNumber()
  @IsOptional()
  contributionAmount?: number;

  @IsString()
  @IsOptional()
  contributionFrequency?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export * from './create-goal.dto';
export * from './update-goal.dto';
