import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { AIBudgetService } from '../common/services/ai-budget.service';
import {
  CreateBudgetTemplateDto,
  ApplyBudgetTemplateDto,
  AddBudgetCollaboratorDto,
  CreateWhatIfScenarioDto,
  RolloverBudgetDto,
  EnvelopeAllocationDto,
} from './dto/budget-ai.dto';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private aiBudgetService: AIBudgetService,
  ) {}

  async create(userId: string, createBudgetDto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        userId,
        remaining: createBudgetDto.amount,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(
    userId: string,
    period?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: {
      userId: string;
      isActive: boolean;
      period?: string;
    } = { userId, isActive: true };

    if (period) {
      where.period = period;
    }

    const [docs, totalDocs] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              icon: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.budget.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto) {
    await this.findOne(id, userId);

    return this.prisma.budget.update({
      where: { id },
      data: updateBudgetDto,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.budget.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateProgress(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { category: true },
    });

    if (!budget) return;

    // Calculate spent amount for the budget period
    const spent = await this.prisma.transaction.aggregate({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
        type: budget.category?.type,
      },
      _sum: { amount: true },
    });

    const spentAmount = spent._sum.amount || 0;
    const remaining = budget.amount - spentAmount;

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        spent: spentAmount,
        remaining: remaining < 0 ? 0 : remaining,
      },
    });
  }

  async getCurrentPeriodBudgets(userId: string) {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const budgets = await this.findAll(userId, period);

    // Update progress for all budgets
    await Promise.all(
      budgets.docs.map((budget) => this.updateProgress(budget.id)),
    );

    // Fetch updated budgets
    return this.findAll(userId, period);
  }

  async getBudgetAlerts(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        category: true,
      },
    });

    const alerts: {
      budgetId: string;
      budgetName: string;
      category: string;
      percentUsed: number;
      spent: number;
      amount: number;
      remaining: number;
      status: 'warning' | 'exceeded';
    }[] = [];

    for (const budget of budgets) {
      const percentUsed = (budget.spent / budget.amount) * 100;

      if (percentUsed >= budget.alertThreshold * 100) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          category: budget.category?.name || 'Uncategorized',
          percentUsed: Math.round(percentUsed),
          spent: budget.spent,
          amount: budget.amount,
          remaining: budget.remaining,
          status: percentUsed >= 100 ? 'exceeded' : 'warning',
        });
      }
    }

    return alerts;
  }

  // ============================================
  // BUDGET TEMPLATES
  // ============================================

  async createTemplate(userId: string, dto: CreateBudgetTemplateDto) {
    return this.prisma.budgetTemplate.create({
      data: {
        ...dto,
        userId,
        categories: dto.categories as any,
        frequency: dto.frequency as any,
      },
    });
  }

  async getTemplates(userId: string) {
    return this.prisma.budgetTemplate.findMany({
      where: {
        OR: [{ userId }, { isSystem: true }, { isPublic: true }],
      },
      orderBy: [{ isSystem: 'desc' }, { timesUsed: 'desc' }],
    });
  }

  async applyTemplate(userId: string, dto: ApplyBudgetTemplateDto) {
    const template = await this.prisma.budgetTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const categories = template.categories as any[];
    const adjustment = (dto.adjustmentPercentage || 0) / 100;

    // Create budgets for each category in template
    const budgets = await Promise.all(
      categories.map((cat) => {
        const amount = cat.amount * (1 + adjustment);
        const startDate = new Date(dto.period + '-01');
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of month

        return this.prisma.budget.create({
          data: {
            userId,
            categoryId: cat.categoryId,
            name: `${dto.period} Budget`,
            type: 'MONTHLY',
            budgetingMethod: template.budgetingMethod,
            amount,
            period: dto.period,
            startDate,
            endDate,
            remaining: amount,
            templateId: template.id,
          },
          include: { category: true },
        });
      }),
    );

    // Increment template usage
    await this.prisma.budgetTemplate.update({
      where: { id: template.id },
      data: { timesUsed: { increment: 1 } },
    });

    return budgets;
  }

  // ============================================
  // BUDGET COLLABORATION
  // ============================================

  async addCollaborator(
    userId: string,
    budgetId: string,
    dto: AddBudgetCollaboratorDto,
  ) {
    // Verify budget ownership
    const budget = await this.findOne(budgetId, userId);

    // Check if already a collaborator
    const existing = await this.prisma.budgetCollaborator.findUnique({
      where: {
        budgetId_userId: {
          budgetId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a collaborator');
    }

    // Add collaborator
    const collaborator = await this.prisma.budgetCollaborator.create({
      data: {
        budgetId,
        userId: dto.userId,
        role: dto.role,
        canEdit: dto.canEdit ?? false,
        canDelete: dto.canDelete ?? false,
        canInvite: dto.canInvite ?? false,
        invitedBy: userId,
        acceptedAt: new Date(),
      },
    });

    // Update budget to mark as shared
    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { isShared: true },
    });

    return collaborator;
  }

  async getCollaborators(userId: string, budgetId: string) {
    await this.findOne(budgetId, userId);

    return this.prisma.budgetCollaborator.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeCollaborator(
    userId: string,
    budgetId: string,
    collaboratorId: string,
  ) {
    await this.findOne(budgetId, userId);

    return this.prisma.budgetCollaborator.delete({
      where: { id: collaboratorId },
    });
  }

  // ============================================
  // WHAT-IF SCENARIOS
  // ============================================

  async createScenario(
    userId: string,
    budgetId: string,
    dto: CreateWhatIfScenarioDto,
  ) {
    await this.findOne(budgetId, userId);

    // Use AI to analyze scenario
    const analysis = await this.aiBudgetService.analyzeWhatIfScenario(
      userId,
      budgetId,
      dto.assumptions,
    );

    return this.prisma.budgetScenario.create({
      data: {
        budgetId,
        userId,
        name: dto.name,
        description: dto.description,
        scenarioType: dto.scenarioType,
        assumptions: dto.assumptions as any,
        projectedSpent: analysis.projectedSpent,
        projectedSavings: analysis.projectedSavings,
        analysis: analysis as any,
      },
    });
  }

  async getScenarios(userId: string, budgetId: string) {
    await this.findOne(budgetId, userId);

    return this.prisma.budgetScenario.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // ROLLOVER BUDGETS
  // ============================================

  async rolloverBudget(userId: string, dto: RolloverBudgetDto) {
    const budget = await this.findOne(dto.budgetId, userId);

    if (!budget.rolloverUnused) {
      throw new BadRequestException('Rollover is not enabled for this budget');
    }

    const unusedAmount = budget.remaining > 0 ? budget.remaining : 0;
    const adjustment = (dto.adjustmentPercentage || 0) / 100;
    const newAmount = budget.amount * (1 + adjustment) + unusedAmount;

    const startDate = new Date(dto.nextPeriod + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: budget.categoryId,
        name: budget.name,
        type: budget.type,
        budgetingMethod: budget.budgetingMethod,
        amount: newAmount,
        period: dto.nextPeriod,
        startDate,
        endDate,
        rolloverUnused: budget.rolloverUnused,
        rolloverAmount: unusedAmount,
        alertThreshold: budget.alertThreshold,
        remaining: newAmount,
        templateId: budget.templateId,
      },
      include: { category: true },
    });
  }

  async processMonthlyRollovers() {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextPeriod = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

    // Find all budgets with rollover enabled that end this month
    const budgets = await this.prisma.budget.findMany({
      where: {
        rolloverUnused: true,
        period: currentPeriod,
        isActive: true,
      },
    });

    const rolledOver: any[] = [];
    for (const budget of budgets) {
      try {
        const newBudget = await this.rolloverBudget(budget.userId, {
          budgetId: budget.id,
          nextPeriod,
        });
        rolledOver.push(newBudget);
      } catch (error) {
        console.error(`Failed to rollover budget ${budget.id}:`, error);
      }
    }

    return rolledOver;
  }

  // ============================================
  // ENVELOPE BUDGETING
  // ============================================

  async createEnvelopeBudget(userId: string, dto: EnvelopeAllocationDto) {
    const startDate = new Date(dto.period + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    // Validate total allocation
    const totalAllocated = dto.envelopes.reduce(
      (sum, env) => sum + env.amount,
      0,
    );
    if (totalAllocated !== dto.totalAmount) {
      throw new BadRequestException(
        'Total envelope allocation must equal total amount',
      );
    }

    // Create envelope budgets
    const budgets = await Promise.all(
      dto.envelopes.map((envelope) =>
        this.prisma.budget.create({
          data: {
            userId,
            categoryId: envelope.categoryId,
            name: envelope.name,
            type: 'MONTHLY',
            budgetingMethod: 'ENVELOPE',
            amount: envelope.amount,
            period: dto.period,
            startDate,
            endDate,
            envelopeAllocated: envelope.amount,
            remaining: envelope.amount,
          },
          include: { category: true },
        }),
      ),
    );

    return budgets;
  }

  async transferBetweenEnvelopes(
    userId: string,
    fromBudgetId: string,
    toBudgetId: string,
    amount: number,
  ) {
    const [fromBudget, toBudget] = await Promise.all([
      this.findOne(fromBudgetId, userId),
      this.findOne(toBudgetId, userId),
    ]);

    if (fromBudget.budgetingMethod !== 'ENVELOPE' || toBudget.budgetingMethod !== 'ENVELOPE') {
      throw new BadRequestException('Both budgets must be envelope budgets');
    }

    if (fromBudget.remaining < amount) {
      throw new BadRequestException('Insufficient funds in source envelope');
    }

    // Transfer funds
    await this.prisma.$transaction([
      this.prisma.budget.update({
        where: { id: fromBudgetId },
        data: {
          envelopeAllocated: { decrement: amount },
          remaining: { decrement: amount },
        },
      }),
      this.prisma.budget.update({
        where: { id: toBudgetId },
        data: {
          envelopeAllocated: { increment: amount },
          remaining: { increment: amount },
          amount: { increment: amount },
        },
      }),
    ]);

    return { success: true, amount, from: fromBudgetId, to: toBudgetId };
  }

  // ============================================
  // AI-POWERED FEATURES
  // ============================================

  async getAIRecommendations(userId: string) {
    return this.aiBudgetService.generateBudgetRecommendations(userId);
  }

  async analyzeSpendingPatterns(userId: string, months: number = 6) {
    return this.aiBudgetService.analyzeSpendingPatterns(userId, months);
  }

  async identifyCostReductions(userId: string) {
    return this.aiBudgetService.identifyCostReductions(userId);
  }

  async forecastExpenses(userId: string, days: number = 30) {
    return this.aiBudgetService.forecastExpenses(userId, days);
  }

  async detectAnomalies(userId: string) {
    return this.aiBudgetService.detectAnomalies(userId);
  }

  async getStoredRecommendations(userId: string, budgetId?: string) {
    const where: any = { userId, isViewed: false };
    if (budgetId) {
      where.budgetId = budgetId;
    }

    return this.prisma.aIRecommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async updateRecommendationFeedback(
    userId: string,
    recommendationId: string,
    isAccepted: boolean,
    feedback?: string,
  ) {
    const recommendation = await this.prisma.aIRecommendation.findFirst({
      where: { id: recommendationId, userId },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }

    return this.prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        isViewed: true,
        isAccepted,
        isDismissed: !isAccepted,
        feedback,
      },
    });
  }

  // ============================================
  // BUDGET PERFORMANCE & ANALYTICS
  // ============================================

  async getBudgetPerformance(userId: string, startPeriod: string, endPeriod: string) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        period: {
          gte: startPeriod,
          lte: endPeriod,
        },
      },
      include: { category: true },
      orderBy: { period: 'asc' },
    });

    // Calculate performance metrics
    const performance = budgets.reduce((acc, budget) => {
      const utilization = (budget.spent / budget.amount) * 100;
      const variance = budget.amount - budget.spent;
      const success = utilization <= 100;

      if (!acc[budget.period]) {
        acc[budget.period] = {
          period: budget.period,
          totalBudget: 0,
          totalSpent: 0,
          totalVariance: 0,
          successfulBudgets: 0,
          totalBudgets: 0,
          categories: [],
        };
      }

      acc[budget.period].totalBudget += budget.amount;
      acc[budget.period].totalSpent += budget.spent;
      acc[budget.period].totalVariance += variance;
      acc[budget.period].totalBudgets += 1;
      if (success) acc[budget.period].successfulBudgets += 1;

      acc[budget.period].categories.push({
        name: budget.category?.name || 'Uncategorized',
        budget: budget.amount,
        spent: budget.spent,
        utilization,
        variance,
      });

      return acc;
    }, {} as Record<string, any>);

    return Object.values(performance);
  }

  async getZeroBasedBudgetAllocation(userId: string, period: string, totalIncome: number) {
    // Get AI recommendations for optimal allocation
    const analysis = await this.aiBudgetService.analyzeSpendingPatterns(
      userId,
      3,
    );

    // Calculate zero-based allocation
    const allocation = analysis.recommendations.map((rec) => ({
      category: rec.category,
      recommendedAmount: rec.recommendedBudget,
      percentage: (rec.recommendedBudget / totalIncome) * 100,
      reasoning: rec.reasoning,
    }));

    const totalAllocated = allocation.reduce(
      (sum, a) => sum + a.recommendedAmount,
      0,
    );
    const unallocated = totalIncome - totalAllocated;

    return {
      totalIncome,
      totalAllocated,
      unallocated,
      allocation,
      recommendations: analysis.insights,
    };
  }
}

