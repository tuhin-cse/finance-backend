import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { PayoffStrategy } from '@prisma/client';

export class CalculatePayoffDto {
  @IsEnum(PayoffStrategy)
  strategy: PayoffStrategy;

  @IsNumber()
  @Min(0)
  extraMonthlyPayment: number;

  @IsOptional()
  debtIds?: string[];
}

export class PayoffCalculationResult {
  strategy: PayoffStrategy;
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  monthlyBreakdown: MonthlyPayment[];
  payoffSchedule: DebtPayoffSchedule[];
  summary: PayoffSummary;
}

export class MonthlyPayment {
  month: number;
  totalPayment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export class DebtPayoffSchedule {
  debtId: string;
  debtName: string;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  totalPaid: number;
  totalInterestPaid: number;
  monthsToPayoff: number;
  payoffOrder: number;
  monthlyPayments: MonthlyPayment[];
}

export class PayoffSummary {
  totalDebts: number;
  totalStartingBalance: number;
  totalInterestSaved: number;
  monthsSaved: number;
  recommendedStrategy: PayoffStrategy;
}
