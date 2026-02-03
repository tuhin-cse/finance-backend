import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { DebtType, PayoffStrategy } from '@prisma/client';

export class CreateDebtDto {
  @IsString()
  name: string;

  @IsEnum(DebtType)
  type: DebtType;

  @IsNumber()
  @Min(0)
  originalAmount: number;

  @IsNumber()
  @Min(0)
  currentBalance: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @IsNumber()
  @Min(0)
  minimumPayment: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  paymentDueDate: number;

  @IsString()
  @IsOptional()
  creditorName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsEnum(PayoffStrategy)
  @IsOptional()
  payoffStrategy?: PayoffStrategy;

  @IsDateString()
  startDate: string;
}
