import { PartialType } from '@nestjs/swagger';
import { CreateGoalDto, GoalStatus } from './create-goal.dto';
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDate,
  IsArray,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiPropertyOptional({
    description: 'Current progress percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({
    enum: GoalStatus,
    description: 'Goal status',
  })
  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @ApiPropertyOptional({ description: 'Goal completion date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'XP points earned',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  xpPoints?: number;

  @ApiPropertyOptional({
    description: 'Current level',
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({
    description: 'Current contribution streak',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStreak?: number;

  @ApiPropertyOptional({
    description: 'Longest contribution streak',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  longestStreak?: number;

  @ApiPropertyOptional({
    description: 'Earned badges',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @ApiPropertyOptional({ description: 'Last contribution date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  lastContributionDate?: Date;

  @ApiPropertyOptional({
    description: 'Mark goal as active/inactive',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
