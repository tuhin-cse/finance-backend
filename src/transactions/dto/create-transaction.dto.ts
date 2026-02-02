import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  CLEARED = 'CLEARED',
  VOID = 'VOID',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'Account ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Transaction date' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: 'Transaction status',
    default: 'POSTED',
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Subcategory' })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Transaction tags', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Merchant name' })
  @IsString()
  @IsOptional()
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Merchant category' })
  @IsString()
  @IsOptional()
  merchantCategory?: string;

  @ApiPropertyOptional({ description: 'Merchant logo URL' })
  @IsString()
  @IsOptional()
  merchantLogo?: string;

  @ApiPropertyOptional({ description: 'GPS location data' })
  @IsObject()
  @IsOptional()
  location?: any;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Receipt URL' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Is recurring transaction' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Recurring transaction ID' })
  @IsString()
  @IsOptional()
  recurringId?: string;

  @ApiPropertyOptional({ description: 'Is split transaction' })
  @IsBoolean()
  @IsOptional()
  isSplit?: boolean;

  @ApiPropertyOptional({ description: 'Split transaction IDs', type: [String] })
  @IsArray()
  @IsOptional()
  splitTransactionIds?: string[];

  @ApiPropertyOptional({ description: 'Plaid transaction ID' })
  @IsString()
  @IsOptional()
  plaidTransactionId?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
