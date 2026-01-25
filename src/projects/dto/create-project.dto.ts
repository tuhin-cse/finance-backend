import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PriorityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Project status', default: 'PLANNING' })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: PriorityLevel, description: 'Priority level', default: 'MEDIUM' })
  @IsEnum(PriorityLevel)
  @IsOptional()
  priority?: PriorityLevel;

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

  @ApiPropertyOptional({ description: 'Project deadline' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;

  @ApiPropertyOptional({ description: 'Budget amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetAmount?: number;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsString()
  @IsOptional()
  clientId?: string;
}
