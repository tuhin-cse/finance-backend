import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class ExtraPaymentImpactDto {
  @IsString()
  debtId: string;

  @IsNumber()
  @Min(0)
  extraPaymentAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfPayments?: number; // If null, assume one-time payment
}

export class ExtraPaymentImpactResult {
  debtName: string;
  currentBalance: number;
  interestRate: number;
  
  // Without extra payment
  withoutExtraPayment: PaymentScenario;
  
  // With extra payment
  withExtraPayment: PaymentScenario;
  
  // Impact
  impact: PaymentImpact;
  
  // Recommendation
  recommendation: string;
}

export class PaymentScenario {
  monthlyPayment: number;
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: string;
}

export class PaymentImpact {
  monthsSaved: number;
  interestSaved: number;
  totalSaved: number;
  percentageFaster: number;
  newPayoffDate: string;
}

export class BulkExtraPaymentDto {
  @IsNumber()
  @Min(0)
  extraPaymentAmount: number;

  @IsOptional()
  debtIds?: string[];
}

export class BulkExtraPaymentResult {
  totalExtraPayment: number;
  debtsImpacted: number;
  debtImpacts: ExtraPaymentImpactResult[];
  totalMonthsSaved: number;
  totalInterestSaved: number;
  recommendation: string;
}
