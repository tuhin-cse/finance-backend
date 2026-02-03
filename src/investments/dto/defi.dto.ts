import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum DeFiProtocol {
  UNISWAP = 'UNISWAP',
  AAVE = 'AAVE',
  COMPOUND = 'COMPOUND',
  CURVE = 'CURVE',
  BALANCER = 'BALANCER',
  SUSHISWAP = 'SUSHISWAP',
  PANCAKESWAP = 'PANCAKESWAP',
  OTHER = 'OTHER',
}

export class DeFiPositionDto {
  @IsString()
  protocol: string;

  @IsString()
  blockchain: string;

  @IsString()
  positionType: string; // liquidity, lending, borrowing, staking

  @IsString()
  @IsOptional()
  poolAddress?: string;
}

export class DeFiPortfolioDto {
  totalValue: number;
  positions: DeFiPositionDetail[];
  protocolBreakdown: ProtocolBreakdownDto[];
  earnings: DeFiEarningsDto;
}

export class DeFiPositionDetail {
  protocol: string;
  blockchain: string;
  positionType: string;
  poolName: string;
  tokens: TokenBalance[];
  totalValue: number;
  apy: number;
  dailyEarnings: number;
  totalEarnings: number;
}

export class TokenBalance {
  symbol: string;
  amount: number;
  value: number;
}

export class ProtocolBreakdownDto {
  protocol: string;
  value: number;
  percentage: number;
  positions: number;
}

export class DeFiEarningsDto {
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number;
}

export class NFTDto {
  @IsString()
  tokenId: string;

  @IsString()
  contractAddress: string;

  @IsString()
  blockchain: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class NFTPortfolioDto {
  totalValue: number;
  totalCount: number;
  nfts: NFTDetail[];
  collections: NFTCollectionDto[];
  floorValueSum: number;
}

export class NFTDetail {
  tokenId: string;
  contractAddress: string;
  blockchain: string;
  name: string;
  collection: string;
  imageUrl: string;
  floorPrice: number;
  lastSalePrice: number;
  estimatedValue: number;
  rarity: string;
  traits: Record<string, string>;
}

export class NFTCollectionDto {
  contractAddress: string;
  name: string;
  count: number;
  floorPrice: number;
  totalValue: number;
  blockchain: string;
}

export class StakingPositionDto {
  @IsString()
  protocol: string;

  @IsString()
  token: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  validatorAddress?: string;
}

export class StakingPortfolioDto {
  totalStaked: number;
  totalRewards: number;
  positions: StakingDetail[];
  averageApy: number;
}

export class StakingDetail {
  protocol: string;
  token: string;
  blockchain: string;
  amountStaked: number;
  currentValue: number;
  rewards: number;
  apy: number;
  lockPeriod: string;
  unlockDate: string;
}

export class YieldFarmingDto {
  @IsString()
  protocol: string;

  @IsString()
  poolAddress: string;

  @IsString()
  blockchain: string;
}

export class YieldFarmingPortfolioDto {
  totalValue: number;
  totalRewards: number;
  farms: YieldFarmDetail[];
  averageApy: number;
}

export class YieldFarmDetail {
  protocol: string;
  poolName: string;
  blockchain: string;
  lpTokens: number;
  totalValue: number;
  rewards: TokenBalance[];
  apy: number;
  dailyRewards: number;
}
