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
import { DebtsService } from './debts.service';
import {
  CreateDebtDto,
  UpdateDebtDto,
  CalculatePayoffDto,
  RefinanceComparisonDto,
  ConsolidationPlanDto,
  UpdateCreditLimitDto,
  ExtraPaymentImpactDto,
  BulkExtraPaymentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  @Post()
  create(@GetUser('id') userId: string, @Body() createDebtDto: CreateDebtDto) {
    return this.debtsService.create(userId, createDebtDto);
  }

  @Get()
  findAll(
    @GetUser('id') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.debtsService.findAll(userId, page, limit, isActiveBoolean);
  }

  @Get('statistics')
  getStatistics(@GetUser('id') userId: string) {
    return this.debtsService.getDebtStatistics(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.debtsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateDebtDto: UpdateDebtDto,
  ) {
    return this.debtsService.update(id, userId, updateDebtDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.debtsService.remove(id, userId);
  }

  // ============================================
  // Snowball/Avalanche Calculator
  // ============================================

  @Post('calculate-payoff')
  calculatePayoff(
    @GetUser('id') userId: string,
    @Body() calculateDto: CalculatePayoffDto,
  ) {
    return this.debtsService.calculatePayoffStrategy(userId, calculateDto);
  }

  // ============================================
  // Refinancing Comparison
  // ============================================

  @Post('compare-refinancing')
  compareRefinancing(
    @GetUser('id') userId: string,
    @Body() refinanceDto: RefinanceComparisonDto,
  ) {
    return this.debtsService.compareRefinancing(userId, refinanceDto);
  }

  // ============================================
  // Consolidation Planner
  // ============================================

  @Post('plan-consolidation')
  planConsolidation(
    @GetUser('id') userId: string,
    @Body() consolidationDto: ConsolidationPlanDto,
  ) {
    return this.debtsService.planConsolidation(userId, consolidationDto);
  }

  // ============================================
  // Credit Utilization Tracking
  // ============================================

  @Get('credit/utilization')
  getCreditUtilization(@GetUser('id') userId: string) {
    return this.debtsService.calculateCreditUtilization(userId);
  }

  @Patch(':id/credit-limit')
  updateCreditLimit(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateDto: UpdateCreditLimitDto,
  ) {
    return this.debtsService.updateCreditLimit(id, userId, updateDto);
  }

  // ============================================
  // Extra Payment Impact Analysis
  // ============================================

  @Post('analyze-extra-payment')
  analyzeExtraPayment(
    @GetUser('id') userId: string,
    @Body() impactDto: ExtraPaymentImpactDto,
  ) {
    return this.debtsService.analyzeExtraPaymentImpact(userId, impactDto);
  }

  @Post('analyze-bulk-extra-payment')
  analyzeBulkExtraPayment(
    @GetUser('id') userId: string,
    @Body() bulkDto: BulkExtraPaymentDto,
  ) {
    return this.debtsService.analyzeBulkExtraPayment(userId, bulkDto);
  }
}
