import { IsNumber, Min, Max } from 'class-validator';

export class CreditUtilizationResult {
  totalCreditLimit: number;
  totalUsedCredit: number;
  utilizationPercentage: number;
  utilizationByCard: CardUtilization[];
  recommendation: string;
  impactOnCreditScore: string;
}

export class CardUtilization {
  debtId: string;
  cardName: string;
  creditLimit: number;
  currentBalance: number;
  utilization: number;
  recommendation: string;
}

export class UpdateCreditLimitDto {
  @IsNumber()
  @Min(0)
  creditLimit: number;
}
