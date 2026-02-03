import { IsNumber, IsString, IsOptional, Min, Max, IsArray } from 'class-validator';

export class RefinanceComparisonDto {
  @IsString()
  debtId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  newInterestRate: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refinancingFees?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  newTermMonths?: number;
}

export class RefinanceComparisonResult {
  currentLoan: LoanDetails;
  refinancedLoan: LoanDetails;
  comparison: RefinanceComparison;
  breakEvenMonth: number;
  recommendation: string;
}

export class LoanDetails {
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
}

export class RefinanceComparison {
  monthlyPaymentDifference: number;
  totalInterestSavings: number;
  totalSavings: number;
  isWorthIt: boolean;
}

export class ConsolidationPlanDto {
  @IsArray()
  debtIds: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  consolidatedInterestRate: number;

  @IsNumber()
  @Min(1)
  consolidatedTermMonths: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  consolidationFees?: number;
}

export class ConsolidationPlanResult {
  currentDebts: DebtSummary[];
  consolidatedLoan: ConsolidatedLoanDetails;
  comparison: ConsolidationComparison;
  recommendation: string;
}

export class DebtSummary {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
}

export class ConsolidatedLoanDetails {
  totalBalance: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  fees: number;
}

export class ConsolidationComparison {
  currentTotalMonthlyPayment: number;
  consolidatedMonthlyPayment: number;
  monthlyPaymentDifference: number;
  currentTotalInterest: number;
  consolidatedTotalInterest: number;
  totalInterestSavings: number;
  isWorthIt: boolean;
}
