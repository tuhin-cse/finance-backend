import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDate,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReimbursementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateExpenseDto {
  @ApiProperty({ description: 'Expense date' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ description: 'Expense description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Expense amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Expense category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Receipt URL' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Receipt OCR data' })
  @IsObject()
  @IsOptional()
  receiptOcrData?: any;

  @ApiPropertyOptional({ description: 'Is this expense reimbursable' })
  @IsBoolean()
  @IsOptional()
  isReimbursable?: boolean;

  @ApiPropertyOptional({ enum: ReimbursementStatus, description: 'Reimbursement status', default: 'PENDING' })
  @IsEnum(ReimbursementStatus)
  @IsOptional()
  reimbursementStatus?: ReimbursementStatus;

  @ApiPropertyOptional({ description: 'Project ID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Is this expense tax deductible' })
  @IsBoolean()
  @IsOptional()
  isTaxDeductible?: boolean;

  @ApiPropertyOptional({ enum: ApprovalStatus, description: 'Approval status', default: 'PENDING' })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  approvalStatus?: ApprovalStatus;
}
