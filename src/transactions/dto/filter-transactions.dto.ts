import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, TransactionStatus } from './create-transaction.dto';

export class FilterTransactionsDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  take?: number;
}
