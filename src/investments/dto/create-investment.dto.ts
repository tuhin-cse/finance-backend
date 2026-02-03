import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { InvestmentType } from '@prisma/client';

export class CreateInvestmentDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsEnum(InvestmentType)
  type: InvestmentType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  currentPrice: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  purchaseDate: string;
}
