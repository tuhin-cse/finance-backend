import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class BrokerageAccountDto {
  @IsString()
  accountName: string;

  @IsString()
  broker: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  apiSecret?: string;
}

export class PortfolioValueDto {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: HoldingDto[];
  assetAllocation: AssetAllocationDto[];
  performance: PerformanceDto;
}

export class HoldingDto {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number;
}

export class AssetAllocationDto {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

export class PerformanceDto {
  oneDay: number;
  oneWeek: number;
  oneMonth: number;
  threeMonths: number;
  sixMonths: number;
  oneYear: number;
  allTime: number;
}

export class SyncBrokerageDto {
  @IsString()
  accountId: string;

  @IsArray()
  @IsOptional()
  symbols?: string[];
}
