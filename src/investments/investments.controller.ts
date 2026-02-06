import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import {
  CreateInvestmentDto,
  SetTargetAllocationDto,
  UpdateInvestmentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Investments & Crypto')
@ApiBearerAuth()
@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create a new investment or crypto holding' })
  @ApiResponse({ status: 201, description: 'Investment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @GetUser('id') userId: string,
    @Body() createInvestmentDto: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(userId, createInvestmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all investments with pagination and filters' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by investment type (STOCK, CRYPTO, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of investments',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('id') userId: string,
    @Query('organizationId') organizationId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('type') type?: string,
  ) {
    return this.investmentsService.findAll(
      userId,
      organizationId,
      page,
      limit,
      type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific investment by ID' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiResponse({ status: 200, description: 'Returns investment details' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.investmentsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing investment' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiResponse({ status: 200, description: 'Investment updated successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(id, userId, updateInvestmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an investment' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiResponse({ status: 200, description: 'Investment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.investmentsService.remove(id, userId);
  }

  // ============================================
  // Portfolio & Brokerage
  // ============================================

  @Get('portfolio/value')
  @ApiOperation({
    summary: 'Get total portfolio value with allocation and performance',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns portfolio value, holdings, allocation percentages, and performance metrics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPortfolioValue(@GetUser('id') userId: string) {
    return this.investmentsService.getPortfolioValue(userId);
  }

  @Post('portfolio/update-prices')
  @ApiOperation({ summary: 'Update current prices for all holdings' })
  @ApiResponse({
    status: 200,
    description:
      'Prices updated successfully with count of updated investments',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updatePrices(@GetUser('id') userId: string) {
    return this.investmentsService.updatePrices(userId);
  }

  @Get('portfolio/metrics')
  @ApiOperation({ summary: 'Get detailed portfolio performance metrics' })
  @ApiResponse({
    status: 200,
    description:
      'Returns total gain/loss, ROI percentage, and volatility metrics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPortfolioMetrics(@GetUser('id') userId: string) {
    return this.investmentsService.getPortfolioMetrics(userId);
  }

  // ============================================
  // Crypto Wallet Integration
  // ============================================

  @Get('crypto/portfolio')
  @ApiOperation({
    summary: 'Get crypto portfolio across all supported blockchains',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns crypto holdings grouped by blockchain with values and percentages',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCryptoPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getCryptoPortfolio(userId);
  }

  @Get('crypto/chains')
  @ApiOperation({ summary: 'Get list of supported blockchain networks (100+)' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of supported chains with network details',
  })
  getSupportedChains() {
    return this.investmentsService.getSupportedChains();
  }

  @Post('crypto/sync-wallet')
  @ApiOperation({ summary: 'Sync crypto wallet from external blockchain' })
  @ApiResponse({
    status: 200,
    description:
      'Wallet synced successfully with balance and transaction count',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address or blockchain',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get DeFi positions across protocols (Uniswap, Aave, Compound)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns DeFi positions with protocol, pairs, TVL, APY, and earnings',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDeFiPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getDeFiPortfolio(userId);
  }

  @Get('nft/portfolio')
  @ApiOperation({
    summary: 'Get NFT collection with floor prices and valuations',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns NFT holdings with collection details, floor prices, and total value',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getNFTPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getNFTPortfolio(userId);
  }

  @Get('staking/portfolio')
  @ApiOperation({ summary: 'Get staking positions across multiple protocols' })
  @ApiResponse({
    status: 200,
    description:
      'Returns staking positions with protocol, asset, staked amount, APY, and rewards',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStakingPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getStakingPortfolio(userId);
  }

  @Get('yield-farming/portfolio')
  @ApiOperation({ summary: 'Get yield farming positions with APY tracking' })
  @ApiResponse({
    status: 200,
    description:
      'Returns yield farming positions with protocol, pool, deposited amount, APY, and earnings',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getYieldFarmingPortfolio(@GetUser('id') userId: string) {
    return this.investmentsService.getYieldFarmingPortfolio(userId);
  }

  // ============================================
  // Asset Allocation & Rebalancing
  // ============================================

  @Get('allocation/analysis')
  @ApiOperation({
    summary:
      'Get asset allocation analysis with risk and diversification metrics',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns current allocation, target allocation, risk score, and diversification metrics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAssetAllocation(@GetUser('id') userId: string) {
    return this.investmentsService.getAssetAllocation(userId);
  }

  @Post('allocation/set-target')
  @ApiOperation({ summary: 'Set target asset allocation percentages' })
  @ApiResponse({
    status: 200,
    description: 'Target allocation updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid allocation percentages (must sum to 100)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  setTargetAllocation(
    @GetUser('id') userId: string,
    @Body() dto: SetTargetAllocationDto,
  ) {
    return this.investmentsService.setTargetAllocation(userId, dto);
  }

  @Get('allocation/rebalance-alerts')
  @ApiOperation({
    summary: 'Get rebalancing alerts when allocation drifts from target',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Deviation threshold percentage (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns array of rebalancing recommendations with actions and amounts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
