import { IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AllocationBreakdown {
  @ApiProperty({ description: 'Asset category', example: 'STOCK' })
  category: string;

  @ApiProperty({ description: 'Total value in category', example: 50000 })
  value: number;

  @ApiProperty({ description: 'Percentage of portfolio', example: 65.5 })
  percentage: number;

  @ApiProperty({ description: 'Number of assets in category', example: 5 })
  count: number;

  @ApiProperty({ description: 'List of asset symbols', example: ['AAPL', 'GOOGL', 'MSFT'] })
  assets: string[];
}

export class AllocationDeviation {
  @ApiProperty({ description: 'Asset category', example: 'CRYPTO' })
  category: string;

  @ApiProperty({ description: 'Current allocation percentage', example: 15 })
  currentPercentage: number;

  @ApiProperty({ description: 'Target allocation percentage', example: 10 })
  targetPercentage: number;

  @ApiProperty({ description: 'Deviation amount', example: 5 })
  deviation: number;

  @ApiProperty({ description: 'Allocation status', enum: ['OVER', 'UNDER', 'BALANCED'], example: 'OVER' })
  status: 'OVER' | 'UNDER' | 'BALANCED';
}

export class RebalanceRecommendation {
  @ApiProperty({ description: 'Recommended action', enum: ['BUY', 'SELL'], example: 'SELL' })
  action: 'BUY' | 'SELL';

  @ApiProperty({ description: 'Asset symbol', example: 'BTC' })
  symbol: string;

  @ApiProperty({ description: 'Current allocation percentage', example: 15 })
  currentAllocation: number;

  @ApiProperty({ description: 'Target allocation percentage', example: 10 })
  targetAllocation: number;

  @ApiProperty({ description: 'Amount to rebalance', example: 0.5 })
  amount: number;

  @ApiProperty({ description: 'Value to rebalance', example: 5000 })
  value: number;

  @ApiProperty({ description: 'Reason for recommendation', example: 'Over-allocated by 5%' })
  reason: string;

  @ApiProperty({ description: 'Priority level', enum: ['HIGH', 'MEDIUM', 'LOW'], example: 'MEDIUM' })
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class AssetAllocationAnalysis {
  @ApiProperty({ type: [AllocationBreakdown] })
  current: AllocationBreakdown[];

  @ApiProperty({ type: [AllocationBreakdown] })
  target: AllocationBreakdown[];

  @ApiProperty({ type: [AllocationDeviation] })
  deviation: AllocationDeviation[];

  @ApiProperty({ type: [RebalanceRecommendation] })
  recommendations: RebalanceRecommendation[];

  @ApiProperty({ description: 'Overall portfolio risk score (0-100)', example: 65 })
  riskScore: number;

  @ApiProperty({ description: 'Portfolio diversification score (0-100)', example: 78 })
  diversificationScore: number;
}

export class TargetAllocation {
  @ApiProperty({ description: 'Asset category', example: 'STOCK' })
  category: string;

  @ApiProperty({ description: 'Target percentage (0-100)', example: 60 })
  targetPercentage: number;
}

export class SetTargetAllocationDto {
  @ApiProperty({ 
    type: [TargetAllocation],
    description: 'Target allocation percentages (must sum to 100)',
    example: [
      { category: 'STOCK', targetPercentage: 60 },
      { category: 'CRYPTO', targetPercentage: 20 },
      { category: 'BOND', targetPercentage: 20 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetAllocation)
  allocations: TargetAllocation[];
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
