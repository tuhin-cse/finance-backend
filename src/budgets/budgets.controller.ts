import {
  Body,
  Controller,
  DefaultValuePipe,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import {
  AddBudgetCollaboratorDto,
  AIRecommendationFeedbackDto,
  ApplyBudgetTemplateDto,
  CreateBudgetTemplateDto,
  CreateWhatIfScenarioDto,
  EnvelopeAllocationDto,
  ForecastExpensesDto,
  RolloverBudgetDto,
} from './dto/budget-ai.dto';
import {
  CreateBudgetAllocationDto,
  UpdateBudgetAllocationDto,
  CreateBudgetTransactionDto,
  TransferBetweenAllocationsDto,
  Setup50_30_20Dto,
  SetupPayYourselfFirstDto,
} from './dto/budget-allocation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Budgets')
@ApiBearerAuth('JWT-auth')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  create(
    @GetUser('id') userId: string,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Filter by period (e.g., 2026-01)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of budgets' })
  findAll(
    @GetUser('id') userId: string,
    @Query('period') period?: string,
    @Query('organizationId') organizationId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.budgetsService.findAll(
      userId,
      period,
      organizationId,
      page,
      limit,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current period budgets with updated progress' })
  @ApiResponse({
    status: 200,
    description: 'Current period budgets with spending data',
  })
  getCurrentPeriodBudgets(@GetUser('id') userId: string) {
    return this.budgetsService.getCurrentPeriodBudgets(userId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get budget alerts for overspending' })
  @ApiResponse({ status: 200, description: 'List of budget alerts' })
  getBudgetAlerts(@GetUser('id') userId: string) {
    return this.budgetsService.getBudgetAlerts(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget details' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.budgetsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget (soft delete)' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.budgetsService.remove(id, userId);
  }

  @Post(':id/update-progress')
  @ApiOperation({ summary: 'Manually refresh budget progress' })
  @ApiResponse({ status: 200, description: 'Budget progress updated' })
  updateProgress(@Param('id') id: string) {
    return this.budgetsService.updateProgress(id);
  }

  // ============================================
  // BUDGET TEMPLATES
  // ============================================

  @Post('templates')
  @ApiOperation({ summary: 'Create a budget template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  createTemplate(
    @GetUser('id') userId: string,
    @Body() dto: CreateBudgetTemplateDto,
  ) {
    return this.budgetsService.createTemplate(userId, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all available budget templates' })
  @ApiResponse({
    status: 200,
    description: 'List of templates (user, system, and public)',
  })
  getTemplates(@GetUser('id') userId: string) {
    return this.budgetsService.getTemplates(userId);
  }

  @Post('templates/apply')
  @ApiOperation({ summary: 'Apply a template to create budgets' })
  @ApiResponse({ status: 201, description: 'Budgets created from template' })
  applyTemplate(
    @GetUser('id') userId: string,
    @Body() dto: ApplyBudgetTemplateDto,
  ) {
    return this.budgetsService.applyTemplate(userId, dto);
  }

  // ============================================
  // BUDGET COLLABORATION
  // ============================================

  @Post(':budgetId/collaborators')
  @ApiOperation({ summary: 'Add a collaborator to a budget' })
  @ApiResponse({ status: 201, description: 'Collaborator added successfully' })
  addCollaborator(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: AddBudgetCollaboratorDto,
  ) {
    return this.budgetsService.addCollaborator(userId, budgetId, dto);
  }

  @Get(':budgetId/collaborators')
  @ApiOperation({ summary: 'Get all collaborators for a budget' })
  @ApiResponse({ status: 200, description: 'List of collaborators' })
  getCollaborators(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
  ) {
    return this.budgetsService.getCollaborators(userId, budgetId);
  }

  @Delete(':budgetId/collaborators/:collaboratorId')
  @ApiOperation({ summary: 'Remove a collaborator from a budget' })
  @ApiResponse({
    status: 200,
    description: 'Collaborator removed successfully',
  })
  removeCollaborator(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.budgetsService.removeCollaborator(
      userId,
      budgetId,
      collaboratorId,
    );
  }

  // ============================================
  // WHAT-IF SCENARIOS
  // ============================================

  @Post(':budgetId/scenarios')
  @ApiOperation({ summary: 'Create a what-if scenario' })
  @ApiResponse({
    status: 201,
    description: 'Scenario created with AI analysis',
  })
  createScenario(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: CreateWhatIfScenarioDto,
  ) {
    return this.budgetsService.createScenario(userId, budgetId, dto);
  }

  @Get(':budgetId/scenarios')
  @ApiOperation({ summary: 'Get all scenarios for a budget' })
  @ApiResponse({ status: 200, description: 'List of scenarios' })
  getScenarios(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
  ) {
    return this.budgetsService.getScenarios(userId, budgetId);
  }

  // ============================================
  // ROLLOVER BUDGETS
  // ============================================

  @Post('rollover')
  @ApiOperation({ summary: 'Rollover a budget to next period' })
  @ApiResponse({
    status: 201,
    description: 'Budget rolled over successfully with unused amount',
  })
  rolloverBudget(
    @GetUser('id') userId: string,
    @Body() dto: RolloverBudgetDto,
  ) {
    return this.budgetsService.rolloverBudget(userId, dto);
  }

  // ============================================
  // ENVELOPE BUDGETING
  // ============================================

  @Post('envelopes')
  @ApiOperation({ summary: 'Create envelope budget allocation' })
  @ApiResponse({ status: 201, description: 'Envelope budgets created' })
  createEnvelopeBudget(
    @GetUser('id') userId: string,
    @Body() dto: EnvelopeAllocationDto,
  ) {
    return this.budgetsService.createEnvelopeBudget(userId, dto);
  }

  @Post('envelopes/transfer')
  @ApiOperation({ summary: 'Transfer funds between envelopes' })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  transferBetweenEnvelopes(
    @GetUser('id') userId: string,
    @Body()
    body: { fromBudgetId: string; toBudgetId: string; amount: number },
  ) {
    return this.budgetsService.transferBetweenEnvelopes(
      userId,
      body.fromBudgetId,
      body.toBudgetId,
      body.amount,
    );
  }

  // ============================================
  // AI-POWERED FEATURES
  // ============================================

  @Get('ai/recommendations')
  @ApiOperation({ summary: 'Get AI-powered budget recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Personalized budget recommendations',
  })
  getAIRecommendations(@GetUser('id') userId: string) {
    return this.budgetsService.getAIRecommendations(userId);
  }

  @Get('ai/spending-analysis')
  @ApiOperation({ summary: 'Analyze spending patterns with AI' })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to analyze',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed spending pattern analysis',
  })
  analyzeSpendingPatterns(
    @GetUser('id') userId: string,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.budgetsService.analyzeSpendingPatterns(userId, months);
  }

  @Get('ai/cost-reductions')
  @ApiOperation({ summary: 'Identify cost reduction opportunities' })
  @ApiResponse({
    status: 200,
    description: 'AI-identified cost savings opportunities',
  })
  identifyCostReductions(@GetUser('id') userId: string) {
    return this.budgetsService.identifyCostReductions(userId);
  }

  @Post('ai/forecast')
  @ApiOperation({ summary: 'Forecast future expenses with AI' })
  @ApiResponse({ status: 200, description: 'Expense forecast' })
  forecastExpenses(
    @GetUser('id') userId: string,
    @Body() dto: ForecastExpensesDto,
  ) {
    return this.budgetsService.forecastExpenses(userId, dto.days || 30);
  }

  @Get('ai/anomalies')
  @ApiOperation({ summary: 'Detect spending anomalies' })
  @ApiResponse({ status: 200, description: 'List of detected anomalies' })
  detectAnomalies(@GetUser('id') userId: string) {
    return this.budgetsService.detectAnomalies(userId);
  }

  @Get('ai/stored-recommendations')
  @ApiOperation({ summary: 'Get stored AI recommendations' })
  @ApiQuery({
    name: 'budgetId',
    required: false,
    description: 'Filter by budget ID',
  })
  @ApiResponse({ status: 200, description: 'List of recommendations' })
  getStoredRecommendations(
    @GetUser('id') userId: string,
    @Query('budgetId') budgetId?: string,
  ) {
    return this.budgetsService.getStoredRecommendations(userId, budgetId);
  }

  @Patch('ai/recommendations/:id/feedback')
  @ApiOperation({ summary: 'Provide feedback on AI recommendation' })
  @ApiResponse({ status: 200, description: 'Feedback recorded' })
  updateRecommendationFeedback(
    @GetUser('id') userId: string,
    @Param('id') recommendationId: string,
    @Body() dto: AIRecommendationFeedbackDto,
  ) {
    return this.budgetsService.updateRecommendationFeedback(
      userId,
      recommendationId,
      dto.isAccepted,
      dto.feedback,
    );
  }

  // ============================================
  // ANALYTICS & PERFORMANCE
  // ============================================

  @Get('analytics/performance')
  @ApiOperation({ summary: 'Get budget performance analytics' })
  @ApiQuery({
    name: 'startPeriod',
    required: true,
    description: 'Start period (YYYY-MM)',
  })
  @ApiQuery({
    name: 'endPeriod',
    required: true,
    description: 'End period (YYYY-MM)',
  })
  @ApiResponse({ status: 200, description: 'Budget performance metrics' })
  getBudgetPerformance(
    @GetUser('id') userId: string,
    @Query('startPeriod') startPeriod: string,
    @Query('endPeriod') endPeriod: string,
  ) {
    return this.budgetsService.getBudgetPerformance(
      userId,
      startPeriod,
      endPeriod,
    );
  }

  @Post('analytics/zero-based')
  @ApiOperation({ summary: 'Get zero-based budget allocation recommendation' })
  @ApiResponse({
    status: 200,
    description: 'AI-powered zero-based budget allocation',
  })
  getZeroBasedBudgetAllocation(
    @GetUser('id') userId: string,
    @Body() body: { period: string; totalIncome: number },
  ) {
    return this.budgetsService.getZeroBasedBudgetAllocation(
      userId,
      body.period,
      body.totalIncome,
    );
  }

  // ============================================
  // BUDGET ALLOCATIONS
  // ============================================

  @Post(':budgetId/allocations')
  @ApiOperation({ summary: 'Create an allocation within a budget' })
  @ApiResponse({ status: 201, description: 'Allocation created successfully' })
  createAllocation(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: CreateBudgetAllocationDto,
  ) {
    return this.budgetsService.createAllocation(userId, budgetId, dto);
  }

  @Get(':budgetId/allocations')
  @ApiOperation({ summary: 'Get all allocations for a budget' })
  @ApiResponse({ status: 200, description: 'List of allocations' })
  getAllocations(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
  ) {
    return this.budgetsService.getAllocations(userId, budgetId);
  }

  @Patch(':budgetId/allocations/:allocationId')
  @ApiOperation({ summary: 'Update an allocation' })
  @ApiResponse({ status: 200, description: 'Allocation updated successfully' })
  updateAllocation(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Param('allocationId') allocationId: string,
    @Body() dto: UpdateBudgetAllocationDto,
  ) {
    return this.budgetsService.updateAllocation(userId, budgetId, allocationId, dto);
  }

  @Delete(':budgetId/allocations/:allocationId')
  @ApiOperation({ summary: 'Delete an allocation' })
  @ApiResponse({ status: 200, description: 'Allocation deleted successfully' })
  deleteAllocation(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Param('allocationId') allocationId: string,
  ) {
    return this.budgetsService.deleteAllocation(userId, budgetId, allocationId);
  }

  // ============================================
  // BUDGET TRANSACTIONS
  // ============================================

  @Post(':budgetId/transactions')
  @ApiOperation({ summary: 'Record a transaction against a budget' })
  @ApiResponse({ status: 201, description: 'Transaction recorded successfully' })
  recordBudgetTransaction(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: CreateBudgetTransactionDto,
  ) {
    return this.budgetsService.recordBudgetTransaction(userId, budgetId, dto);
  }

  @Get(':budgetId/transactions')
  @ApiOperation({ summary: 'Get transactions for a budget' })
  @ApiQuery({
    name: 'allocationId',
    required: false,
    description: 'Filter by allocation ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Paginated list of budget transactions' })
  getBudgetTransactions(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Query('allocationId') allocationId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.budgetsService.getBudgetTransactions(userId, budgetId, allocationId, page, limit);
  }

  @Post(':budgetId/allocations/transfer')
  @ApiOperation({ summary: 'Transfer funds between allocations' })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  transferBetweenAllocations(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: TransferBetweenAllocationsDto,
  ) {
    return this.budgetsService.transferBetweenAllocations(userId, budgetId, dto);
  }

  // ============================================
  // QUICK SETUP METHODS
  // ============================================

  @Post(':budgetId/setup-50-30-20')
  @ApiOperation({ summary: 'Quick setup 50/30/20 budget allocations' })
  @ApiResponse({ status: 201, description: '50/30/20 allocations created' })
  setup50_30_20(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: Setup50_30_20Dto,
  ) {
    return this.budgetsService.setup50_30_20(userId, budgetId, dto);
  }

  @Post(':budgetId/setup-pay-yourself-first')
  @ApiOperation({ summary: 'Quick setup Pay Yourself First budget allocations' })
  @ApiResponse({ status: 201, description: 'Pay Yourself First allocations created' })
  setupPayYourselfFirst(
    @GetUser('id') userId: string,
    @Param('budgetId') budgetId: string,
    @Body() dto: SetupPayYourselfFirstDto,
  ) {
    return this.budgetsService.setupPayYourselfFirst(userId, budgetId, dto);
  }
}

