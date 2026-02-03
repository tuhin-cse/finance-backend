import { IsNumber, IsOptional, IsArray } from 'class-validator';

export class AssetAllocationAnalysis {
  current: AllocationBreakdown[];
  target: AllocationBreakdown[];
  deviation: AllocationDeviation[];
  recommendations: RebalanceRecommendation[];
  riskScore: number;
  diversificationScore: number;
}

export class AllocationBreakdown {
  category: string;
  value: number;
  percentage: number;
  count: number;
  assets: string[];
}

export class AllocationDeviation {
  category: string;
  currentPercentage: number;
  targetPercentage: number;
  deviation: number;
  status: 'OVER' | 'UNDER' | 'BALANCED';
}

export class RebalanceRecommendation {
  action: 'BUY' | 'SELL';
  symbol: string;
  currentAllocation: number;
  targetAllocation: number;
  amount: number;
  value: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class SetTargetAllocationDto {
  @IsArray()
  allocations: TargetAllocation[];
}

export class TargetAllocation {
  category: string;
  targetPercentage: number;
}

export class RebalanceAlertDto {
  @IsNumber()
  @IsOptional()
  thresholdPercentage?: number;
}

export class RebalanceAlert {
  alertId: string;
  triggeredAt: Date;
  deviations: AllocationDeviation[];
  recommendations: RebalanceRecommendation[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export class PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  volatility: number;
  sharpeRatio: number;
  beta: number;
  alpha: number;
  diversification: DiversificationMetrics;
  riskMetrics: RiskMetrics;
}

export class DiversificationMetrics {
  score: number; // 0-100
  assetCount: number;
  categoryCount: number;
  concentrationRisk: number;
  topHoldingPercentage: number;
  herfindahlIndex: number;
}

export class RiskMetrics {
  score: number; // 0-100 (higher = more risky)
  volatility: number;
  maxDrawdown: number;
  valueAtRisk: number;
  conditionalValueAtRisk: number;
  riskCategory: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}
