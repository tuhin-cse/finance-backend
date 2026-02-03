import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import {
  CreateInvestmentDto,
  UpdateInvestmentDto,
  SetTargetAllocationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  @Post()
  create(
    @GetUser('id') userId: string,
    @Body() createInvestmentDto: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(userId, createInvestmentDto);
  }

  @Get()
  findAll(
    @GetUser('id') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('type') type?: string,
  ) {
    return this.investmentsService.findAll(userId, page, limit, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.investmentsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(id, userId, updateInvestmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.investmentsService.remove(id, userId);
  }

  // ============================================
  // Portfolio & Brokerage
  // ============================================

  @Get('portfolio/value')
  getPortfolioValue(@GetUser('id') userId: string) {
    return this.investmentsService.getPortfolioValue(userId);
  }

  @Post('portfolio/update-prices')
  updatePrices(@GetUser('id') userId: string) {
    return this.investmentsService.updatePrices(userId);
  }

  @Get('portfolio/metrics')
  getPortfolioMetrics(@GetUser('id') userId: string) {
    return this.investmentsService.getPortfolioMetrics(userId);
  }

  // ============================================
  // Crypto Wallet Integration
  // ============================================

  @Get('crypto/portfolio')
  getCryptoPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getCryptoPortfolio(userId);
  }

  @Get('crypto/chains')
  getSupportedChains() {
    return this.investmentsService.getSupportedChains();
  }

  @Post('crypto/sync-wallet')
  syncCryptoWallet(
    @GetUser('id') userId: string,
    @Body('walletAddress') walletAddress: string,
    @Body('blockchain') blockchain: string,
  ) {
    return this.investmentsService.syncCryptoWallet(
      userId,
      walletAddress,
      blockchain,
    );
  }

  // ============================================
  // DeFi, NFT, Staking, Yield Farming
  // ============================================

  @Get('defi/portfolio')
  getDeFiPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getDeFiPortfolio(userId);
  }

  @Get('nft/portfolio')
  getNFTPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getNFTPortfolio(userId);
  }

  @Get('staking/portfolio')
  getStakingPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getStakingPortfolio(userId);
  }

  @Get('yield-farming/portfolio')
  getYieldFarmingPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getYieldFarmingPortfolio(userId);
  }

  // ============================================
  // Asset Allocation & Rebalancing
  // ============================================

  @Get('allocation/analysis')
  getAssetAllocation(@GetUser('id') userId: string) {
    return this.investmentsService.getAssetAllocation(userId);
  }

  @Post('allocation/set-target')
  setTargetAllocation(
    @GetUser('id') userId: string,
    @Body() dto: SetTargetAllocationDto,
  ) {
    return this.investmentsService.setTargetAllocation(userId, dto);
  }

  @Get('allocation/rebalance-alerts')
  checkRebalanceAlerts(
    @GetUser('id') userId: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.investmentsService.checkRebalanceAlerts(
      userId,
      threshold ? +threshold : 5,
    );
  }
}
