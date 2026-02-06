import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Investment } from '@prisma/client';
import {
  AllocationBreakdown,
  AllocationDeviation,
  AssetAllocationAnalysis,
  AssetAllocationDto,
  ChainBreakdownDto,
  CreateInvestmentDto,
  CryptoHoldingDto,
  CryptoPortfolioDto,
  DeFiEarningsDto,
  DeFiPortfolioDto,
  DeFiPositionDetail,
  DiversificationMetrics,
  HoldingDto,
  NFTCollectionDto,
  NFTDetail,
  NFTPortfolioDto,
  PerformanceDto,
  PortfolioMetrics,
  PortfolioValueDto,
  ProtocolBreakdownDto,
  RebalanceAlert,
  RebalanceRecommendation,
  RiskMetrics,
  SetTargetAllocationDto,
  StakingDetail,
  StakingPortfolioDto,
  SUPPORTED_CHAINS,
  UpdateInvestmentDto,
  YieldFarmDetail,
  YieldFarmingPortfolioDto,
} from './dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  async create(userId: string, createDto: CreateInvestmentDto) {
    const totalValue = createDto.quantity * createDto.currentPrice;
    const totalCost = createDto.quantity * createDto.purchasePrice;
    const totalGain = totalValue - totalCost;
    const totalGainPercent = (totalGain / totalCost) * 100;

    return this.prisma.investment.create({
      data: {
        ...createDto,
        userId,
        purchaseDate: new Date(createDto.purchaseDate),
        totalValue,
        totalGain,
        totalGainPercent,
        currency: createDto.currency || 'USD',
      },
    });
  }

  async findAll(
    userId: string,
    organizationId?: string,
    page: number = 1,
    limit: number = 10,
    type?: string,
  ) {
    const where: { userId: string; organizationId: string | null; type?: any } =
      {
        userId,
        organizationId: organizationId || null,
      };
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.investment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investment.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, userId: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id, userId },
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    return investment;
  }

  async update(id: string, userId: string, updateDto: UpdateInvestmentDto) {
    await this.findOne(id, userId);

    const updateData: any = { ...updateDto };

    if (updateDto.purchaseDate) {
      updateData.purchaseDate = new Date(updateDto.purchaseDate);
    }

    // Recalculate metrics if price or quantity changed
    if (
      updateDto.quantity ||
      updateDto.currentPrice ||
      updateDto.purchasePrice
    ) {
      const investment = await this.findOne(id, userId);
      const quantity = updateDto.quantity ?? investment.quantity;
      const currentPrice = updateDto.currentPrice ?? investment.currentPrice;
      const purchasePrice = updateDto.purchasePrice ?? investment.purchasePrice;

      const totalValue = quantity * currentPrice;
      const totalCost = quantity * purchasePrice;
      const totalGain = totalValue - totalCost;
      const totalGainPercent = (totalGain / totalCost) * 100;

      updateData.totalValue = totalValue;
      updateData.totalGain = totalGain;
      updateData.totalGainPercent = totalGainPercent;
    }

    return this.prisma.investment.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.investment.delete({ where: { id } });
  }

  // ============================================
  // Brokerage Account & Portfolio Value
  // ============================================

  async getPortfolioValue(userId: string): Promise<PortfolioValueDto> {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    if (investments.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: [],
        assetAllocation: [],
        performance: {
          oneDay: 0,
          oneWeek: 0,
          oneMonth: 0,
          threeMonths: 0,
          sixMonths: 0,
          oneYear: 0,
          allTime: 0,
        },
      };
    }

    const totalValue = investments.reduce(
      (sum, inv) => sum + inv.totalValue,
      0,
    );
    const totalCost = investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.purchasePrice,
      0,
    );
    const totalGain = totalValue - totalCost;
    const totalGainPercent = (totalGain / totalCost) * 100;

    // Simulate day change (in real app, fetch from price API)
    const dayChange = totalValue * 0.012; // 1.2% simulated
    const dayChangePercent = 1.2;

    const holdings: HoldingDto[] = investments.map((inv) => ({
      id: inv.id,
      symbol: inv.symbol,
      name: inv.name,
      type: inv.type,
      quantity: inv.quantity,
      purchasePrice: inv.purchasePrice,
      currentPrice: inv.currentPrice,
      totalValue: inv.totalValue,
      totalCost: inv.quantity * inv.purchasePrice,
      totalGain: inv.totalGain,
      totalGainPercent: inv.totalGainPercent,
      dayChange: inv.totalValue * 0.012,
      dayChangePercent: 1.2,
      allocation: (inv.totalValue / totalValue) * 100,
    }));

    const assetAllocation = this.calculateAssetAllocation(
      investments,
      totalValue,
    );

    const performance: PerformanceDto = {
      oneDay: 1.2,
      oneWeek: 3.5,
      oneMonth: 8.2,
      threeMonths: 15.7,
      sixMonths: 24.3,
      oneYear: 42.5,
      allTime: totalGainPercent,
    };

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      holdings,
      assetAllocation,
      performance,
    };
  }

  private calculateAssetAllocation(
    investments: Investment[],
    totalValue: number,
  ): AssetAllocationDto[] {
    const allocation = investments.reduce(
      (acc, inv) => {
        if (!acc[inv.type]) {
          acc[inv.type] = { value: 0, count: 0 };
        }
        acc[inv.type].value += inv.totalValue;
        acc[inv.type].count += 1;
        return acc;
      },
      {} as Record<string, { value: number; count: number }>,
    );

    return Object.entries(allocation).map(([type, data]) => ({
      type,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      count: data.count,
    }));
  }

  async updatePrices(userId: string): Promise<{ updated: number }> {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    // In production, fetch real prices from APIs
    // For now, simulate price updates
    let updated = 0;

    for (const investment of investments) {
      // Simulate price change (-5% to +5%)
      const priceChange = (Math.random() - 0.5) * 0.1;
      const newPrice = investment.currentPrice * (1 + priceChange);

      const totalValue = investment.quantity * newPrice;
      const totalCost = investment.quantity * investment.purchasePrice;
      const totalGain = totalValue - totalCost;
      const totalGainPercent = (totalGain / totalCost) * 100;

      await this.prisma.investment.update({
        where: { id: investment.id },
        data: {
          currentPrice: newPrice,
          totalValue,
          totalGain,
          totalGainPercent,
        },
      });

      updated++;
    }

    return { updated };
  }

  // ============================================
  // Crypto Wallet Integration
  // ============================================

  async getCryptoPortfolio(userId: string): Promise<CryptoPortfolioDto> {
    const cryptoInvestments = await this.prisma.investment.findMany({
      where: { userId, type: 'CRYPTO' },
    });

    if (cryptoInvestments.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: [],
        chains: [],
      };
    }

    const totalValue = cryptoInvestments.reduce(
      (sum, inv) => sum + inv.totalValue,
      0,
    );
    const totalCost = cryptoInvestments.reduce(
      (sum, inv) => sum + inv.quantity * inv.purchasePrice,
      0,
    );
    const totalGain = totalValue - totalCost;
    const totalGainPercent = (totalGain / totalCost) * 100;
    const dayChange = totalValue * 0.035; // 3.5% simulated
    const dayChangePercent = 3.5;

    const holdings: CryptoHoldingDto[] = cryptoInvestments.map((inv) => ({
      symbol: inv.symbol,
      name: inv.name,
      blockchain: this.getBlockchainForSymbol(inv.symbol),
      quantity: inv.quantity,
      purchasePrice: inv.purchasePrice,
      currentPrice: inv.currentPrice,
      totalValue: inv.totalValue,
      totalCost: inv.quantity * inv.purchasePrice,
      totalGain: inv.totalGain,
      totalGainPercent: inv.totalGainPercent,
      dayChange: inv.totalValue * 0.035,
      dayChangePercent: 3.5,
      allocation: (inv.totalValue / totalValue) * 100,
    }));

    const chains = this.calculateChainBreakdown(holdings, totalValue);

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      holdings,
      chains,
    };
  }

  private getBlockchainForSymbol(symbol: string): string {
    // Map common crypto symbols to their native blockchains
    const mapping: Record<string, string> = {
      ETH: 'Ethereum',
      BTC: 'Bitcoin',
      BNB: 'Binance Smart Chain',
      MATIC: 'Polygon',
      AVAX: 'Avalanche',
      SOL: 'Solana',
      ADA: 'Cardano',
      DOT: 'Polkadot',
    };
    return mapping[symbol] || 'Ethereum';
  }

  private calculateChainBreakdown(
    holdings: CryptoHoldingDto[],
    totalValue: number,
  ): ChainBreakdownDto[] {
    const breakdown = holdings.reduce(
      (acc, holding) => {
        if (!acc[holding.blockchain]) {
          acc[holding.blockchain] = {
            value: 0,
            count: 0,
            assets: [],
          };
        }
        acc[holding.blockchain].value += holding.totalValue;
        acc[holding.blockchain].count += 1;
        acc[holding.blockchain].assets.push(holding.symbol);
        return acc;
      },
      {} as Record<string, { value: number; count: number; assets: string[] }>,
    );

    return Object.entries(breakdown).map(([blockchain, data]) => ({
      blockchain,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      count: data.count,
      assets: data.assets,
    }));
  }

  async getSupportedChains() {
    return {
      total: SUPPORTED_CHAINS.length,
      chains: SUPPORTED_CHAINS,
    };
  }

  async syncCryptoWallet(
    userId: string,
    walletAddress: string,
    blockchain: string,
  ) {
    // In production, integrate with blockchain explorers/APIs
    // For now, return simulated data
    return {
      walletAddress,
      blockchain,
      synced: true,
      assetsFound: 5,
      message: 'Wallet synced successfully. Found 5 crypto assets.',
    };
  }

  // ============================================
  // DeFi, NFT, Staking, Yield Farming
  // ============================================

  async getDeFiPortfolio(_userId: string): Promise<DeFiPortfolioDto> {
    // In production, integrate with DeFi protocols
    // For now, return simulated data
    const positions: DeFiPositionDetail[] = [
      {
        protocol: 'Uniswap V3',
        blockchain: 'Ethereum',
        positionType: 'liquidity',
        poolName: 'ETH/USDC 0.3%',
        tokens: [
          { symbol: 'ETH', amount: 2.5, value: 5000 },
          { symbol: 'USDC', amount: 5000, value: 5000 },
        ],
        totalValue: 10000,
        apy: 25.5,
        dailyEarnings: 6.99,
        totalEarnings: 450,
      },
      {
        protocol: 'Aave V3',
        blockchain: 'Polygon',
        positionType: 'lending',
        poolName: 'USDC Lending',
        tokens: [{ symbol: 'USDC', amount: 15000, value: 15000 }],
        totalValue: 15000,
        apy: 12.3,
        dailyEarnings: 5.06,
        totalEarnings: 750,
      },
    ];

    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);

    const protocolBreakdown: ProtocolBreakdownDto[] = positions.reduce(
      (acc, pos) => {
        const existing = acc.find((p) => p.protocol === pos.protocol);
        if (existing) {
          existing.value += pos.totalValue;
          existing.positions += 1;
        } else {
          acc.push({
            protocol: pos.protocol,
            value: pos.totalValue,
            percentage: 0,
            positions: 1,
          });
        }
        return acc;
      },
      [] as ProtocolBreakdownDto[],
    );

    protocolBreakdown.forEach((p) => {
      p.percentage = (p.value / totalValue) * 100;
    });

    const earnings: DeFiEarningsDto = {
      daily: positions.reduce((sum, pos) => sum + pos.dailyEarnings, 0),
      weekly: positions.reduce((sum, pos) => sum + pos.dailyEarnings * 7, 0),
      monthly: positions.reduce((sum, pos) => sum + pos.dailyEarnings * 30, 0),
      allTime: positions.reduce((sum, pos) => sum + pos.totalEarnings, 0),
    };

    return {
      totalValue,
      positions,
      protocolBreakdown,
      earnings,
    };
  }

  async getNFTPortfolio(_userId: string): Promise<NFTPortfolioDto> {
    // In production, integrate with NFT APIs (OpenSea, Alchemy, etc.)
    // For now, return simulated data
    const nfts: NFTDetail[] = [
      {
        tokenId: '1234',
        contractAddress: '0x...',
        blockchain: 'Ethereum',
        name: 'Bored Ape #1234',
        collection: 'Bored Ape Yacht Club',
        imageUrl: 'https://...',
        floorPrice: 35,
        lastSalePrice: 40,
        estimatedValue: 35,
        rarity: 'Rare',
        traits: { Background: 'Blue', Eyes: 'Laser', Fur: 'Gold' },
      },
      {
        tokenId: '5678',
        contractAddress: '0x...',
        blockchain: 'Ethereum',
        name: 'CryptoPunk #5678',
        collection: 'CryptoPunks',
        imageUrl: 'https://...',
        floorPrice: 65,
        lastSalePrice: 70,
        estimatedValue: 65,
        rarity: 'Common',
        traits: { Type: 'Ape', Accessory: 'Cap' },
      },
    ];

    const totalValue = nfts.reduce((sum, nft) => sum + nft.estimatedValue, 0);
    const floorValueSum = nfts.reduce((sum, nft) => sum + nft.floorPrice, 0);

    const collections: NFTCollectionDto[] = nfts.reduce((acc, nft) => {
      const existing = acc.find((c) => c.name === nft.collection);
      if (existing) {
        existing.count += 1;
        existing.totalValue += nft.estimatedValue;
      } else {
        acc.push({
          contractAddress: nft.contractAddress,
          name: nft.collection,
          count: 1,
          floorPrice: nft.floorPrice,
          totalValue: nft.estimatedValue,
          blockchain: nft.blockchain,
        });
      }
      return acc;
    }, [] as NFTCollectionDto[]);

    return {
      totalValue,
      totalCount: nfts.length,
      nfts,
      collections,
      floorValueSum,
    };
  }

  async getStakingPortfolio(_userId: string): Promise<StakingPortfolioDto> {
    // In production, integrate with staking platforms
    // For now, return simulated data
    const positions: StakingDetail[] = [
      {
        protocol: 'Ethereum 2.0',
        token: 'ETH',
        blockchain: 'Ethereum',
        amountStaked: 32,
        currentValue: 64000,
        rewards: 1.5,
        apy: 4.5,
        lockPeriod: 'Until Shanghai upgrade',
        unlockDate: 'TBD',
      },
      {
        protocol: 'Cardano',
        token: 'ADA',
        blockchain: 'Cardano',
        amountStaked: 50000,
        currentValue: 25000,
        rewards: 2500,
        apy: 5.2,
        lockPeriod: 'None',
        unlockDate: 'Available',
      },
    ];

    const totalStaked = positions.reduce(
      (sum, pos) => sum + pos.currentValue,
      0,
    );
    const totalRewards = positions.reduce((sum, pos) => sum + pos.rewards, 0);
    const averageApy =
      positions.reduce((sum, pos) => sum + pos.apy, 0) / positions.length;

    return {
      totalStaked,
      totalRewards,
      positions,
      averageApy,
    };
  }

  async getYieldFarmingPortfolio(
    _userId: string,
  ): Promise<YieldFarmingPortfolioDto> {
    // In production, integrate with yield farming platforms
    // For now, return simulated data
    const farms: YieldFarmDetail[] = [
      {
        protocol: 'PancakeSwap',
        poolName: 'CAKE-BNB LP',
        blockchain: 'Binance Smart Chain',
        lpTokens: 100,
        totalValue: 5000,
        rewards: [{ symbol: 'CAKE', amount: 50, value: 250 }],
        apy: 85.5,
        dailyRewards: 11.71,
      },
      {
        protocol: 'Curve',
        poolName: '3pool',
        blockchain: 'Ethereum',
        lpTokens: 10000,
        totalValue: 10000,
        rewards: [
          { symbol: 'CRV', amount: 100, value: 50 },
          { symbol: 'CVX', amount: 25, value: 150 },
        ],
        apy: 15.2,
        dailyRewards: 4.16,
      },
    ];

    const totalValue = farms.reduce((sum, farm) => sum + farm.totalValue, 0);
    const totalRewards = farms.reduce(
      (sum, farm) => sum + farm.rewards.reduce((s, r) => s + r.value, 0),
      0,
    );
    const averageApy =
      farms.reduce((sum, farm) => sum + farm.apy, 0) / farms.length;

    return {
      totalValue,
      totalRewards,
      farms,
      averageApy,
    };
  }

  // ============================================
  // Asset Allocation & Rebalancing
  // ============================================

  async getAssetAllocation(userId: string): Promise<AssetAllocationAnalysis> {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    if (investments.length === 0) {
      throw new BadRequestException('No investments found');
    }

    const totalValue = investments.reduce(
      (sum, inv) => sum + inv.totalValue,
      0,
    );

    const current: AllocationBreakdown[] = this.calculateAllocationBreakdown(
      investments,
      totalValue,
    );

    // Default target allocation (can be customized)
    const target: AllocationBreakdown[] = [
      { category: 'STOCK', value: 0, percentage: 40, count: 0, assets: [] },
      { category: 'BOND', value: 0, percentage: 30, count: 0, assets: [] },
      { category: 'CRYPTO', value: 0, percentage: 15, count: 0, assets: [] },
      { category: 'ETF', value: 0, percentage: 10, count: 0, assets: [] },
      { category: 'OTHER', value: 0, percentage: 5, count: 0, assets: [] },
    ];

    const deviation: AllocationDeviation[] = current.map((curr) => {
      const tgt = target.find((t) => t.category === curr.category) || {
        percentage: 0,
      };
      const dev = curr.percentage - tgt.percentage;

      return {
        category: curr.category,
        currentPercentage: curr.percentage,
        targetPercentage: tgt.percentage,
        deviation: dev,
        status: Math.abs(dev) < 5 ? 'BALANCED' : dev > 0 ? 'OVER' : 'UNDER',
      };
    });

    const recommendations: RebalanceRecommendation[] = [];

    for (const dev of deviation) {
      if (Math.abs(dev.deviation) >= 5) {
        const action = dev.deviation > 0 ? 'SELL' : 'BUY';
        const amount = (Math.abs(dev.deviation) / 100) * totalValue;

        // Find representative asset in category
        const asset = investments.find((inv) => inv.type === dev.category);

        if (asset) {
          recommendations.push({
            action,
            symbol: asset.symbol,
            currentAllocation: dev.currentPercentage,
            targetAllocation: dev.targetPercentage,
            amount: amount / asset.currentPrice,
            value: amount,
            reason: `${dev.category} allocation is ${dev.deviation > 0 ? 'over' : 'under'} target by ${Math.abs(dev.deviation).toFixed(1)}%`,
            priority:
              Math.abs(dev.deviation) > 10
                ? 'HIGH'
                : Math.abs(dev.deviation) > 7
                  ? 'MEDIUM'
                  : 'LOW',
          });
        }
      }
    }

    const riskScore = this.calculateRiskScore(current);
    const diversificationScore = this.calculateDiversificationScore(
      investments,
      current,
    );

    return {
      current,
      target,
      deviation,
      recommendations,
      riskScore,
      diversificationScore,
    };
  }

  private calculateAllocationBreakdown(
    investments: Investment[],
    totalValue: number,
  ): AllocationBreakdown[] {
    const breakdown = investments.reduce(
      (acc, inv) => {
        if (!acc[inv.type]) {
          acc[inv.type] = { value: 0, count: 0, assets: [] };
        }
        acc[inv.type].value += inv.totalValue;
        acc[inv.type].count += 1;
        acc[inv.type].assets.push(inv.symbol);
        return acc;
      },
      {} as Record<string, { value: number; count: number; assets: string[] }>,
    );

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      count: data.count,
      assets: data.assets,
    }));
  }

  private calculateRiskScore(allocations: AllocationBreakdown[]): number {
    // Higher crypto/stock allocation = higher risk
    const riskWeights: Record<string, number> = {
      CRYPTO: 100,
      STOCK: 70,
      ETF: 40,
      MUTUAL_FUND: 35,
      REAL_ESTATE: 30,
      COMMODITY: 60,
      BOND: 20,
      OTHER: 50,
    };

    let score = 0;
    for (const alloc of allocations) {
      const weight = riskWeights[alloc.category] || 50;
      score += (weight * alloc.percentage) / 100;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateDiversificationScore(
    investments: Investment[],
    allocations: AllocationBreakdown[],
  ): number {
    // More assets, more categories, better distribution = higher score
    const assetCount = investments.length;
    const categoryCount = allocations.length;

    // Calculate concentration (Herfindahl Index)
    const herfindahl = allocations.reduce(
      (sum, alloc) => sum + Math.pow(alloc.percentage / 100, 2),
      0,
    );

    // Perfect diversification = 0, Complete concentration = 1
    const concentrationPenalty = herfindahl * 50;

    let score = 50; // Base score

    // Reward for number of assets
    score += Math.min(20, assetCount * 2);

    // Reward for number of categories
    score += Math.min(20, categoryCount * 4);

    // Penalize concentration
    score -= concentrationPenalty;

    return Math.min(100, Math.max(0, score));
  }

  async setTargetAllocation(_userId: string, dto: SetTargetAllocationDto) {
    // In production, store in database
    // For now, just validate and return
    const total = dto.allocations.reduce(
      (sum, a) => sum + a.targetPercentage,
      0,
    );

    if (Math.abs(total - 100) > 0.1) {
      throw new BadRequestException('Target allocations must sum to 100%');
    }

    return {
      message: 'Target allocation set successfully',
      allocations: dto.allocations,
    };
  }

  async checkRebalanceAlerts(
    userId: string,
    thresholdPercentage: number = 5,
  ): Promise<RebalanceAlert[]> {
    const analysis = await this.getAssetAllocation(userId);

    const alerts: RebalanceAlert[] = [];

    const significantDeviations = analysis.deviation.filter(
      (dev) => Math.abs(dev.deviation) >= thresholdPercentage,
    );

    if (significantDeviations.length > 0) {
      const maxDeviation = Math.max(
        ...significantDeviations.map((d) => Math.abs(d.deviation)),
      );

      alerts.push({
        alertId: `rebalance-${Date.now()}`,
        triggeredAt: new Date(),
        deviations: significantDeviations,
        recommendations: analysis.recommendations.filter((r) =>
          significantDeviations.some((d) => d.category === r.symbol),
        ),
        severity:
          maxDeviation > 15 ? 'HIGH' : maxDeviation > 10 ? 'MEDIUM' : 'LOW',
        message: `Portfolio is out of balance. ${significantDeviations.length} asset ${significantDeviations.length === 1 ? 'class' : 'classes'} deviate${significantDeviations.length === 1 ? 's' : ''} from target allocation.`,
      });
    }

    return alerts;
  }

  async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics> {
    const portfolio = await this.getPortfolioValue(userId);
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    if (investments.length === 0) {
      throw new BadRequestException('No investments found');
    }

    const allocations = this.calculateAssetAllocation(
      investments,
      portfolio.totalValue,
    );

    // Convert to AllocationBreakdown format
    const allocationBreakdown: AllocationBreakdown[] = allocations.map((a) => ({
      category: a.type,
      value: a.value,
      percentage: a.percentage,
      count: a.count,
      assets: [],
    }));

    // Calculate diversification metrics
    const assetCount = investments.length;
    const categoryCount = allocations.length;

    const topHolding = Math.max(...investments.map((i) => i.totalValue));
    const topHoldingPercentage = (topHolding / portfolio.totalValue) * 100;

    const herfindahlIndex = allocations.reduce(
      (sum, alloc) => sum + Math.pow(alloc.percentage / 100, 2),
      0,
    );

    const concentrationRisk = herfindahlIndex;

    const diversification: DiversificationMetrics = {
      score: this.calculateDiversificationScore(
        investments,
        allocationBreakdown,
      ),
      assetCount,
      categoryCount,
      concentrationRisk,
      topHoldingPercentage,
      herfindahlIndex,
    };

    // Calculate risk metrics
    const volatility = 15.5; // Simulated
    const maxDrawdown = -12.3; // Simulated
    const valueAtRisk = portfolio.totalValue * 0.05; // 5% VaR
    const conditionalValueAtRisk = portfolio.totalValue * 0.08; // 8% CVaR

    const riskScore = this.calculateRiskScore(allocationBreakdown);

    let riskCategory: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    if (riskScore < 40) riskCategory = 'CONSERVATIVE';
    else if (riskScore < 70) riskCategory = 'MODERATE';
    else riskCategory = 'AGGRESSIVE';

    const riskMetrics: RiskMetrics = {
      score: riskScore,
      volatility,
      maxDrawdown,
      valueAtRisk,
      conditionalValueAtRisk,
      riskCategory,
    };

    return {
      totalValue: portfolio.totalValue,
      totalCost: portfolio.totalCost,
      totalReturn: portfolio.totalGain,
      totalReturnPercent: portfolio.totalGainPercent,
      dayChange: portfolio.dayChange,
      dayChangePercent: portfolio.dayChangePercent,
      volatility,
      sharpeRatio: 1.85, // Simulated
      beta: 1.12, // Simulated
      alpha: 2.5, // Simulated
      diversification,
      riskMetrics,
    };
  }
}
