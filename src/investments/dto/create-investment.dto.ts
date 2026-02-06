import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvestmentType } from '@prisma/client';

export class CreateInvestmentDto {
  @ApiPropertyOptional({ description: 'Account ID to associate investment with' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiProperty({ description: 'Stock ticker or crypto symbol (e.g., AAPL, BTC)', example: 'AAPL' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Full name of the investment', example: 'Apple Inc.' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Type of investment', enum: InvestmentType, example: 'STOCK' })
  @IsEnum(InvestmentType)
  type: InvestmentType;

  @ApiProperty({ description: 'Number of shares or tokens owned', example: 10 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Purchase price per unit', example: 150.25 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ description: 'Current market price per unit', example: 175.50 })
  @IsNumber()
  @Min(0)
  currentPrice: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Date of purchase in ISO format', example: '2024-01-15' })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({ description: 'Organization ID to associate investment with' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
