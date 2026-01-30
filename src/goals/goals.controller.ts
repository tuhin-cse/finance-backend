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
import { GoalsService } from './goals.service';
import {
  CreateGoalDto,
  UpdateGoalDto,
  CreateGoalMilestoneDto,
  AddGoalContributionDto,
  AddGoalCollaboratorDto,
  CreateSavingsRuleDto,
  UpdateSavingsRuleDto,
  SetGoalPriorityDto,
  SetDebtStrategyDto,
  CalculateDebtPayoffDto,
  AutoContributeConfigDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Goals')
@ApiBearerAuth('JWT-auth')
@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financial goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  create(@GetUser('id') userId: string, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all financial goals' })
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
  @ApiResponse({ status: 200, description: 'Paginated list of goals' })
  findAll(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.goalsService.findAll(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  @ApiResponse({ status: 200, description: 'Goal details' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.goalsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, userId, updateGoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete goal (soft delete)' })
  @ApiResponse({ status: 200, description: 'Goal deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.goalsService.remove(id, userId);
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Add contribution to goal' })
  @ApiResponse({ status: 200, description: 'Goal progress updated' })
  updateProgress(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.goalsService.updateProgress(id, userId, amount);
  }

  // ============================================
  // MILESTONES
  // ============================================

  @Post('milestones')
  @ApiOperation({ summary: 'Create a milestone for a goal' })
  @ApiResponse({ status: 201, description: 'Milestone created successfully' })
  createMilestone(
    @GetUser('id') userId: string,
    @Body() dto: CreateGoalMilestoneDto,
  ) {
    return this.goalsService.createMilestone(userId, dto);
  }

  @Get(':goalId/milestones')
  @ApiOperation({ summary: 'Get all milestones for a goal' })
  @ApiResponse({ status: 200, description: 'List of milestones' })
  getMilestones(@GetUser('id') userId: string, @Param('goalId') goalId: string) {
    return this.goalsService.getMilestones(userId, goalId);
  }

  @Post('milestones/:milestoneId/complete')
  @ApiOperation({ summary: 'Mark milestone as completed' })
  @ApiResponse({ status: 200, description: 'Milestone completed' })
  completeMilestone(
    @GetUser('id') userId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.goalsService.completeMilestone(userId, milestoneId);
  }

  // ============================================
  // CONTRIBUTIONS
  // ============================================

  @Post(':goalId/contributions')
  @ApiOperation({ summary: 'Add contribution to goal with gamification' })
  @ApiResponse({ status: 201, description: 'Contribution added with rewards' })
  addContribution(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
    @Body() dto: AddGoalContributionDto,
  ) {
    return this.goalsService.addContribution(userId, goalId, dto);
  }

  @Get(':goalId/contributions')
  @ApiOperation({ summary: 'Get all contributions for a goal' })
  @ApiResponse({ status: 200, description: 'List of contributions' })
  getContributions(@GetUser('id') userId: string, @Param('goalId') goalId: string) {
    return this.goalsService.getContributions(userId, goalId);
  }

  @Get(':goalId/contributions/history')
  @ApiOperation({ summary: 'Get contribution history with statistics' })
  @ApiResponse({ status: 200, description: 'Contribution history and stats' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getContributionHistory(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.goalsService.getContributionHistory(userId, goalId, startDate, endDate);
  }

  // ============================================
  // COLLABORATION
  // ============================================

  @Post(':goalId/collaborators')
  @ApiOperation({ summary: 'Add collaborator to goal' })
  @ApiResponse({ status: 201, description: 'Collaborator added' })
  addCollaborator(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
    @Body() dto: AddGoalCollaboratorDto,
  ) {
    return this.goalsService.addCollaborator(userId, goalId, dto);
  }

  @Get(':goalId/collaborators')
  @ApiOperation({ summary: 'Get all collaborators for a goal' })
  @ApiResponse({ status: 200, description: 'List of collaborators' })
  getCollaborators(@GetUser('id') userId: string, @Param('goalId') goalId: string) {
    return this.goalsService.getCollaborators(userId, goalId);
  }

  @Delete(':goalId/collaborators/:collaboratorId')
  @ApiOperation({ summary: 'Remove collaborator from goal' })
  @ApiResponse({ status: 200, description: 'Collaborator removed' })
  removeCollaborator(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.goalsService.removeCollaborator(userId, goalId, collaboratorId);
  }

  // ============================================
  // SAVINGS RULES
  // ============================================

  @Post('savings-rules')
  @ApiOperation({ summary: 'Create automatic savings rule' })
  @ApiResponse({ status: 201, description: 'Savings rule created' })
  createSavingsRule(
    @GetUser('id') userId: string,
    @Body() dto: CreateSavingsRuleDto,
  ) {
    return this.goalsService.createSavingsRule(userId, dto);
  }

  @Get('savings-rules')
  @ApiOperation({ summary: 'Get all savings rules' })
  @ApiResponse({ status: 200, description: 'List of savings rules' })
  @ApiQuery({ name: 'goalId', required: false, type: String })
  getSavingsRules(
    @GetUser('id') userId: string,
    @Query('goalId') goalId?: string,
  ) {
    return this.goalsService.getSavingsRules(userId, goalId);
  }

  @Patch('savings-rules/:ruleId')
  @ApiOperation({ summary: 'Update savings rule' })
  @ApiResponse({ status: 200, description: 'Savings rule updated' })
  updateSavingsRule(
    @GetUser('id') userId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateSavingsRuleDto,
  ) {
    return this.goalsService.updateSavingsRule(userId, ruleId, dto);
  }

  @Delete('savings-rules/:ruleId')
  @ApiOperation({ summary: 'Delete savings rule' })
  @ApiResponse({ status: 200, description: 'Savings rule deleted' })
  deleteSavingsRule(
    @GetUser('id') userId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.goalsService.deleteSavingsRule(userId, ruleId);
  }

  // ============================================
  // PRIORITIZATION
  // ============================================

  @Post('priority')
  @ApiOperation({ summary: 'Set goal priority' })
  @ApiResponse({ status: 200, description: 'Priority updated' })
  setGoalPriority(@GetUser('id') userId: string, @Body() dto: SetGoalPriorityDto) {
    return this.goalsService.setGoalPriority(userId, dto);
  }

  @Get('by-priority')
  @ApiOperation({ summary: 'Get goals sorted by priority' })
  @ApiResponse({ status: 200, description: 'Goals sorted by priority' })
  getGoalsByPriority(@GetUser('id') userId: string) {
    return this.goalsService.getGoalsByPriority(userId);
  }

  // ============================================
  // DEBT PAYOFF STRATEGIES
  // ============================================

  @Post('debt-strategy')
  @ApiOperation({ summary: 'Set debt payoff strategy' })
  @ApiResponse({ status: 200, description: 'Debt strategy applied' })
  setDebtStrategy(@GetUser('id') userId: string, @Body() dto: SetDebtStrategyDto) {
    return this.goalsService.setDebtStrategy(userId, dto);
  }

  @Post('debt-payoff/calculate')
  @ApiOperation({ summary: 'Calculate debt payoff scenarios' })
  @ApiResponse({ status: 200, description: 'Debt payoff calculation completed' })
  calculateDebtPayoff(
    @GetUser('id') userId: string,
    @Body() dto: CalculateDebtPayoffDto,
  ) {
    return this.goalsService.calculateDebtPayoff(userId, dto);
  }

  // ============================================
  // AUTO-CONTRIBUTE
  // ============================================

  @Post(':goalId/auto-contribute')
  @ApiOperation({ summary: 'Configure automatic contributions' })
  @ApiResponse({ status: 200, description: 'Auto-contribute configured' })
  configureAutoContribute(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
    @Body() dto: AutoContributeConfigDto,
  ) {
    return this.goalsService.configureAutoContribute(userId, goalId, dto);
  }

  // ============================================
  // AI-POWERED FEATURES
  // ============================================

  @Get('ai/recommendations')
  @ApiOperation({ summary: 'Get AI-powered goal recommendations' })
  @ApiResponse({ status: 200, description: 'AI goal recommendations' })
  getAIRecommendations(@GetUser('id') userId: string) {
    return this.goalsService.getAIRecommendations(userId);
  }

  @Get(':goalId/ai/achievement-probability')
  @ApiOperation({ summary: 'Calculate goal achievement probability' })
  @ApiResponse({ status: 200, description: 'Achievement probability calculated' })
  calculateAchievementProbability(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
  ) {
    return this.goalsService.calculateAchievementProbability(userId, goalId);
  }

  @Get('ai/debt-payoff-strategy')
  @ApiOperation({ summary: 'Get AI-generated debt payoff strategy' })
  @ApiResponse({ status: 200, description: 'Debt payoff strategy generated' })
  generateDebtPayoffStrategy(@GetUser('id') userId: string) {
    return this.goalsService.generateDebtPayoffStrategy(userId);
  }

  @Get(':goalId/ai/savings-rules')
  @ApiOperation({ summary: 'Get AI-suggested savings rules' })
  @ApiResponse({ status: 200, description: 'Savings rules suggested' })
  suggestSavingsRules(
    @GetUser('id') userId: string,
    @Param('goalId') goalId: string,
  ) {
    return this.goalsService.suggestSavingsRules(userId, goalId);
  }

  @Get('ai/stored-recommendations')
  @ApiOperation({ summary: 'Get stored AI recommendations' })
  @ApiResponse({ status: 200, description: 'Stored recommendations retrieved' })
  @ApiQuery({ name: 'goalId', required: false, type: String })
  getStoredRecommendations(
    @GetUser('id') userId: string,
    @Query('goalId') goalId?: string,
  ) {
    return this.goalsService.getStoredRecommendations(userId, goalId);
  }

  // ============================================
  // GAMIFICATION & LEADERBOARD
  // ============================================

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get gamification leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'all-time'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Query('period') period?: 'week' | 'month' | 'all-time',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.goalsService.getLeaderboard(period, limit);
  }

  @Get('gamification/stats')
  @ApiOperation({ summary: 'Get user gamification statistics' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  getUserStats(@GetUser('id') userId: string) {
    return this.goalsService.getUserStats(userId);
  }

  // ============================================
  // ANALYTICS
  // ============================================

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get comprehensive goal analytics' })
  @ApiResponse({ status: 200, description: 'Goal analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getGoalAnalytics(
    @GetUser('id') userId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.goalsService.getGoalAnalytics(userId, startDate, endDate);
  }
}
