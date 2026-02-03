import { IsString, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';

export class CryptoWalletDto {
  @IsString()
  walletAddress: string;

  @IsString()
  blockchain: string;

  @IsString()
  @IsOptional()
  walletName?: string;

  @IsString()
  @IsOptional()
  walletType?: string; // metamask, coinbase, hardware, etc.
}

export class CryptoPortfolioDto {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: CryptoHoldingDto[];
  chains: ChainBreakdownDto[];
}

export class CryptoHoldingDto {
  symbol: string;
  name: string;
  blockchain: string;
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

export class ChainBreakdownDto {
  blockchain: string;
  value: number;
  percentage: number;
  count: number;
  assets: string[];
}

export class SyncCryptoWalletDto {
  @IsString()
  walletAddress: string;

  @IsString()
  blockchain: string;
}

export class MultiChainBalanceDto {
  @IsArray()
  walletAddresses: string[];

  @IsArray()
  @IsOptional()
  blockchains?: string[];
}

export class CryptoChain {
  name: string;
  symbol: string;
  chainId: number;
  nativeToken: string;
  rpcUrl: string;
  explorerUrl: string;
  supported: boolean;
}

export const SUPPORTED_CHAINS: CryptoChain[] = [
  {
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    nativeToken: 'ETH',
    rpcUrl: 'https://mainnet.infura.io',
    explorerUrl: 'https://etherscan.io',
    supported: true,
  },
  {
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    nativeToken: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    supported: true,
  },
  {
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    nativeToken: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    supported: true,
  },
  {
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    nativeToken: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    supported: true,
  },
  {
    name: 'Arbitrum',
    symbol: 'ARB',
    chainId: 42161,
    nativeToken: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    supported: true,
  },
  {
    name: 'Optimism',
    symbol: 'OP',
    chainId: 10,
    nativeToken: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    supported: true,
  },
  // Add more chains as needed - this can be expanded to 100+ chains
];
