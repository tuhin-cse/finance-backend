import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { AIGoalService } from '../common/services/ai-goal.service';
import {
  CreateGoalMilestoneDto,
  AddGoalContributionDto,
  AddGoalCollaboratorDto,
  CreateSavingsRuleDto,
  UpdateSavingsRuleDto,
  SetGoalPriorityDto,
  SetDebtStrategyDto,
  AutoContributeConfigDto,
  CalculateDebtPayoffDto,
} from './dto/goal-ai.dto';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private aiGoalService: AIGoalService,
  ) {}

  create(userId: string, createGoalDto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        ...createGoalDto,
        userId,
        type: createGoalDto.type as any,
        progress: 0,
        contributionFrequency: createGoalDto.contributionFrequency as any,
        debtStrategy: createGoalDto.debtStrategy as any,
      },
    });
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const where = { userId, isActive: true };

    const [docs, totalDocs] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { targetDate: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.goal.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(id: string, userId: string, updateGoalDto: UpdateGoalDto) {
    await this.findOne(id, userId);

    return this.prisma.goal.update({
      where: { id },
      data: {
        ...updateGoalDto,
      } as any,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.goal.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateProgress(id: string, userId: string, amount: number) {
    const goal = await this.findOne(id, userId);

    const newCurrentAmount = goal.currentAmount + amount;
    const progress = (newCurrentAmount / goal.targetAmount) * 100;
    const status = progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

    return this.prisma.goal.update({
      where: { id },
      data: {
        currentAmount: newCurrentAmount,
        progress: Math.min(progress, 100),
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  // ============================================
  // GOAL MILESTONES
  // ============================================

  async createMilestone(userId: string, dto: CreateGoalMilestoneDto) {
    // Verify goal ownership
    await this.findOne(dto.goalId, userId);

    return this.prisma.goalMilestone.create({
      data: {
        goalId: dto.goalId,
        name: dto.name,
        description: dto.description,
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate,
        order: dto.order,
        xpReward: dto.xpReward || 0,
        badgeReward: dto.badgeReward,
      },
    });
  }

  async getMilestones(userId: string, goalId: string) {
    await this.findOne(goalId, userId);

    return this.prisma.goalMilestone.findMany({
      where: { goalId },
      orderBy: { order: 'asc' },
    });
  }

  async completeMilestone(userId: string, milestoneId: string) {
    const milestone = await this.prisma.goalMilestone.findUnique({
      where: { id: milestoneId },
      include: { goal: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.findOne(milestone.goalId, userId);

    if (milestone.isCompleted) {
      throw new BadRequestException('Milestone already completed');
    }

    // Update milestone
    const updated = await this.prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Award XP to goal if there's a reward
    if (milestone.xpReward > 0) {
      await this.prisma.goal.update({
        where: { id: milestone.goalId },
        data: {
          xpPoints: { increment: milestone.xpReward },
        },
      });
    }

    // Award badge if specified
    if (milestone.badgeReward) {
      await this.prisma.goal.update({
        where: { id: milestone.goalId },
        data: {
          badges: {
            push: milestone.badgeReward,
          },
        },
      });
    }

    return updated;
  }

  // ============================================
  // GOAL CONTRIBUTIONS
  // ============================================

  async addContribution(userId: string, goalId: string, dto: AddGoalContributionDto) {
    const goal = await this.findOne(goalId, userId);

    // Calculate gamification rewards
    const rewards = await this.aiGoalService.calculateGamificationRewards(
      goalId,
      dto.amount,
    );

    // Create contribution
    const contribution = await this.prisma.goalContribution.create({
      data: {
        goalId,
        userId,
        amount: dto.amount,
        note: dto.note,
        transactionId: dto.transactionId,
        xpEarned: rewards.xpEarned,
        streakBonus: rewards.streakBonus,
      },
    });

    // Update goal
    const newCurrentAmount = goal.currentAmount + dto.amount;
    const newProgress = (newCurrentAmount / goal.targetAmount) * 100;
    const newStreak = rewards.streakBonus ? goal.currentStreak + 1 : 1;

    await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: newCurrentAmount,
        progress: Math.min(newProgress, 100),
        status: newProgress >= 100 ? 'COMPLETED' : goal.status,
        completedAt: newProgress >= 100 ? new Date() : null,
        xpPoints: { increment: rewards.xpEarned },
        currentStreak: newStreak,
        longestStreak: Math.max(goal.longestStreak, newStreak),
        lastContributionDate: new Date(),
        badges: rewards.badgesEarned.length > 0 ? { push: rewards.badgesEarned } : undefined,
        level: rewards.levelUp ? rewards.newLevel : goal.level,
      },
    });

    return {
      contribution,
      rewards,
      newProgress: Math.min(newProgress, 100),
      completed: newProgress >= 100,
    };
  }

  async getContributions(userId: string, goalId: string) {
    await this.findOne(goalId, userId);

    return this.prisma.goalContribution.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async getContributionHistory(
    userId: string,
    goalId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    await this.findOne(goalId, userId);

    const where: any = { goalId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const contributions = await this.prisma.goalContribution.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Calculate statistics
    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalXP = contributions.reduce((sum, c) => sum + c.xpEarned, 0);
    const averageContribution = contributions.length > 0 ? totalContributed / contributions.length : 0;

    return {
      contributions,
      statistics: {
        totalContributed,
        totalXP,
        averageContribution,
        contributionCount: contributions.length,
      },
    };
  }

  // ============================================
  // GOAL COLLABORATION
  // ============================================

  async addCollaborator(userId: string, goalId: string, dto: AddGoalCollaboratorDto) {
    await this.findOne(goalId, userId);

    const existing = await this.prisma.goalCollaborator.findUnique({
      where: {
        goalId_userId: {
          goalId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a collaborator');
    }

    const collaborator = await this.prisma.goalCollaborator.create({
      data: {
        goalId,
        userId: dto.userId,
        role: dto.role as any,
        canContribute: dto.canContribute ?? false,
        canEdit: dto.canEdit ?? false,
        canDelete: dto.canDelete ?? false,
        invitedBy: userId,
        acceptedAt: new Date(),
      },
    });

    await this.prisma.goal.update({
      where: { id: goalId },
      data: { isShared: true },
    });

    return collaborator;
  }

  async getCollaborators(userId: string, goalId: string) {
    await this.findOne(goalId, userId);

    return this.prisma.goalCollaborator.findMany({
      where: { goalId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeCollaborator(userId: string, goalId: string, collaboratorId: string) {
    await this.findOne(goalId, userId);

    return this.prisma.goalCollaborator.delete({
      where: { id: collaboratorId },
    });
  }

  // ============================================
  // SAVINGS RULES
  // ============================================

  async createSavingsRule(userId: string, dto: CreateSavingsRuleDto) {
    if (dto.goalId) {
      await this.findOne(dto.goalId, userId);
    }

    return this.prisma.savingsRule.create({
      data: {
        userId,
        goalId: dto.goalId,
        name: dto.name,
        description: dto.description,
        ruleType: dto.ruleType,
        config: dto.config as any,
        frequency: dto.frequency,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getSavingsRules(userId: string, goalId?: string) {
    const where: any = { userId };
    if (goalId) {
      where.goalId = goalId;
    }

    return this.prisma.savingsRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSavingsRule(userId: string, ruleId: string, dto: UpdateSavingsRuleDto) {
    const rule = await this.prisma.savingsRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Savings rule not found');
    }

    return this.prisma.savingsRule.update({
      where: { id: ruleId },
      data: {
        ...dto,
        config: dto.config as any,
      } as any,
    });
  }

  async deleteSavingsRule(userId: string, ruleId: string) {
    const rule = await this.prisma.savingsRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Savings rule not found');
    }

    return this.prisma.savingsRule.delete({
      where: { id: ruleId },
    });
  }

  async executeSavingsRule(ruleId: string, transactionAmount?: number) {
    const rule = await this.prisma.savingsRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || !rule.isActive) {
      return null;
    }

    const config = rule.config as any;
    let savingsAmount = 0;

    switch (rule.ruleType) {
      case 'ROUND_UP':
        if (transactionAmount) {
          const roundUpTo = config.roundUpTo || 1;
          savingsAmount = Math.ceil(transactionAmount / roundUpTo) * roundUpTo - transactionAmount;
        }
        break;

      case 'PERCENTAGE':
        if (transactionAmount) {
          savingsAmount = (transactionAmount * (config.percentage || 0)) / 100;
        }
        break;

      case 'FIXED_AMOUNT':
        savingsAmount = config.amount || 0;
        break;

      case 'SPARE_CHANGE':
        if (transactionAmount) {
          savingsAmount = transactionAmount - Math.floor(transactionAmount);
        }
        break;

      default:
        return null;
    }

    if (savingsAmount > 0 && rule.goalId) {
      // Add contribution to goal
      await this.addContribution(rule.userId, rule.goalId, {
        amount: savingsAmount,
        note: `Automatic savings from rule: ${rule.name}`,
      });

      // Update rule statistics
      await this.prisma.savingsRule.update({
        where: { id: ruleId },
        data: {
          totalSaved: { increment: savingsAmount },
          timesTriggered: { increment: 1 },
          lastExecuted: new Date(),
        },
      });

      return { savingsAmount, goalId: rule.goalId };
    }

    return null;
  }

  // ============================================
  // GOAL PRIORITIZATION
  // ============================================

  async setGoalPriority(userId: string, dto: SetGoalPriorityDto) {
    await this.findOne(dto.goalId, userId);

    return this.prisma.goal.update({
      where: { id: dto.goalId },
      data: { priority: dto.priority },
    });
  }

  async getGoalsByPriority(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, isActive: true },
      orderBy: [{ priority: 'desc' }, { targetDate: 'asc' }],
    });
  }

  // ============================================
  // DEBT PAYOFF STRATEGIES
  // ============================================

  async setDebtStrategy(userId: string, dto: SetDebtStrategyDto) {
    const debtGoals = await this.prisma.goal.findMany({
      where: {
        userId,
        type: 'DEBT_PAYOFF',
        isActive: true,
      },
    });

    if (debtGoals.length === 0) {
      throw new BadRequestException('No debt payoff goals found');
    }

    // Update all debt goals with strategy
    await this.prisma.goal.updateMany({
      where: {
        userId,
        type: 'DEBT_PAYOFF',
        isActive: true,
      },
      data: {
        debtStrategy: dto.strategy,
      },
    });

    // If custom order provided, set priorities
    if (dto.customOrder && dto.customOrder.length > 0) {
      for (let i = 0; i < dto.customOrder.length; i++) {
        await this.prisma.goal.update({
          where: { id: dto.customOrder[i] },
          data: { priority: dto.customOrder.length - i },
        });
      }
    } else if (dto.strategy === 'SNOWBALL') {
      // Sort by balance (smallest first)
      const sorted = [...debtGoals].sort(
        (a, b) => (a.targetAmount - a.currentAmount) - (b.targetAmount - b.currentAmount),
      );
      for (let i = 0; i < sorted.length; i++) {
        await this.prisma.goal.update({
          where: { id: sorted[i].id },
          data: { priority: sorted.length - i },
        });
      }
    } else if (dto.strategy === 'AVALANCHE') {
      // Sort by interest rate (highest first)
      const sorted = [...debtGoals].sort(
        (a, b) => (b.interestRate || 0) - (a.interestRate || 0),
      );
      for (let i = 0; i < sorted.length; i++) {
        await this.prisma.goal.update({
          where: { id: sorted[i].id },
          data: { priority: sorted.length - i },
        });
      }
    }

    return this.getGoalsByPriority(userId);
  }

  async calculateDebtPayoff(userId: string, dto: CalculateDebtPayoffDto) {
    const goals = await this.prisma.goal.findMany({
      where: {
        id: { in: dto.debtGoalIds },
        userId,
        type: 'DEBT_PAYOFF',
      },
    });

    if (goals.length === 0) {
      throw new BadRequestException('No debt goals found');
    }

    const debts = goals.map((g) => ({
      id: g.id,
      name: g.name,
      balance: g.targetAmount - g.currentAmount,
      interestRate: g.interestRate || 0,
      minimumPayment: g.contributionAmount || 0,
    }));

    // Calculate payoff with minimum payments only
    let totalInterestMinimum = 0;
    let monthsToPayoffMinimum = 0;
    
    debts.forEach((debt) => {
      const monthlyRate = debt.interestRate / 12 / 100;
      if (monthlyRate > 0 && debt.minimumPayment > 0) {
        const months = Math.log(debt.minimumPayment / (debt.minimumPayment - debt.balance * monthlyRate)) / Math.log(1 + monthlyRate);
        const totalPaid = debt.minimumPayment * months;
        totalInterestMinimum += totalPaid - debt.balance;
        monthsToPayoffMinimum = Math.max(monthsToPayoffMinimum, months);
      }
    });

    // Calculate with extra payment
    const strategy = dto.strategy || 'AVALANCHE';
    let sortedDebts = [...debts];
    
    if (strategy === 'SNOWBALL') {
      sortedDebts.sort((a, b) => a.balance - b.balance);
    } else {
      sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
    }

    let totalInterestWithExtra = 0;
    let monthsToPayoffWithExtra = 0;
    let remainingDebts = sortedDebts.map((d) => ({ ...d }));
    let month = 0;

    while (remainingDebts.length > 0 && month < 600) {
      month++;
      let extraPaymentRemaining = dto.extraPayment;

      remainingDebts = remainingDebts.map((debt) => {
        // Add interest
        const monthlyRate = debt.interestRate / 12 / 100;
        const interest = debt.balance * monthlyRate;
        totalInterestWithExtra += interest;

        // Apply minimum payment
        debt.balance += interest;
        const payment = Math.min(debt.balance, debt.minimumPayment);
        debt.balance -= payment;

        return debt;
      });

      // Apply extra payment to highest priority debt
      if (remainingDebts.length > 0 && extraPaymentRemaining > 0) {
        const extraPayment = Math.min(remainingDebts[0].balance, extraPaymentRemaining);
        remainingDebts[0].balance -= extraPayment;
      }

      // Remove paid off debts
      remainingDebts = remainingDebts.filter((d) => d.balance > 0.01);
    }

    monthsToPayoffWithExtra = month;

    return {
      strategy,
      debts: sortedDebts.map((d, idx) => ({
        id: d.id,
        name: d.name,
        order: idx + 1,
        balance: d.balance,
        interestRate: d.interestRate,
      })),
      withMinimumPayments: {
        months: Math.ceil(monthsToPayoffMinimum),
        totalInterest: Math.round(totalInterestMinimum),
      },
      withExtraPayment: {
        months: monthsToPayoffWithExtra,
        totalInterest: Math.round(totalInterestWithExtra),
        monthsSaved: Math.ceil(monthsToPayoffMinimum) - monthsToPayoffWithExtra,
        interestSaved: Math.round(totalInterestMinimum - totalInterestWithExtra),
      },
    };
  }

  // ============================================
  // AUTO-CONTRIBUTE
  // ============================================

  async configureAutoContribute(userId: string, goalId: string, dto: AutoContributeConfigDto) {
    await this.findOne(goalId, userId);

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        autoContribute: dto.autoContribute,
        contributionAmount: dto.contributionAmount,
        contributionFrequency: dto.contributionFrequency as any,
        accountId: dto.accountId,
      },
    });
  }

  async processAutoContributions() {
    const now = new Date();
    const goals = await this.prisma.goal.findMany({
      where: {
        autoContribute: true,
        isActive: true,
        status: { not: 'COMPLETED' },
      },
    });

    const processed: any[] = [];
    for (const goal of goals) {
      try {
        // Check if contribution is due based on frequency
        const daysSinceLastContribution = goal.lastContributionDate
          ? Math.floor((now.getTime() - goal.lastContributionDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        let shouldContribute = false;

        switch (goal.contributionFrequency) {
          case 'DAILY':
            shouldContribute = daysSinceLastContribution >= 1;
            break;
          case 'WEEKLY':
            shouldContribute = daysSinceLastContribution >= 7;
            break;
          case 'BI_WEEKLY':
            shouldContribute = daysSinceLastContribution >= 14;
            break;
          case 'MONTHLY':
            shouldContribute = daysSinceLastContribution >= 30;
            break;
          default:
            shouldContribute = false;
        }

        if (shouldContribute && goal.contributionAmount) {
          const result = await this.addContribution(goal.userId, goal.id, {
            amount: goal.contributionAmount,
            note: 'Automatic contribution',
          });
          processed.push({ goalId: goal.id, ...result });
        }
      } catch (error) {
        console.error(`Failed to process auto-contribution for goal ${goal.id}:`, error);
      }
    }

    return processed;
  }

  // ============================================
  // AI-POWERED FEATURES
  // ============================================

  async getAIRecommendations(userId: string) {
    return this.aiGoalService.generateGoalRecommendations(userId);
  }

  async calculateAchievementProbability(userId: string, goalId: string) {
    await this.findOne(goalId, userId);
    return this.aiGoalService.calculateAchievementProbability(userId, goalId);
  }

  async generateDebtPayoffStrategy(userId: string) {
    return this.aiGoalService.generateDebtPayoffStrategy(userId);
  }

  async suggestSavingsRules(userId: string, goalId: string) {
    await this.findOne(goalId, userId);
    return this.aiGoalService.suggestSavingsRules(userId, goalId);
  }

  async getStoredRecommendations(userId: string, goalId?: string) {
    const where: any = { userId, isViewed: false };
    if (goalId) {
      where.goalId = goalId;
    }

    return this.prisma.aIRecommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ============================================
  // GAMIFICATION & LEADERBOARD
  // ============================================

  async getLeaderboard(period: 'week' | 'month' | 'all-time' = 'month', limit: number = 10) {
    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get top users by XP
    const goals = await this.prisma.goal.findMany({
      where: startDate ? { updatedAt: { gte: startDate } } : {},
      orderBy: { xpPoints: 'desc' },
      take: limit * 10,
      select: {
        userId: true,
        xpPoints: true,
        level: true,
        badges: true,
      },
    });

    // Aggregate by user
    const userScores = goals.reduce((acc, goal) => {
      if (!acc[goal.userId]) {
        acc[goal.userId] = {
          userId: goal.userId,
          totalXP: 0,
          level: 0,
          badges: new Set<string>(),
        };
      }
      acc[goal.userId].totalXP += goal.xpPoints;
      acc[goal.userId].level = Math.max(acc[goal.userId].level, goal.level);
      goal.badges.forEach((badge) => acc[goal.userId].badges.add(badge));
      return acc;
    }, {} as Record<string, any>);

    const leaderboard = Object.values(userScores)
      .sort((a: any, b: any) => b.totalXP - a.totalXP)
      .slice(0, limit)
      .map((user: any, index) => ({
        rank: index + 1,
        userId: user.userId,
        totalXP: user.totalXP,
        level: user.level,
        badgeCount: user.badges.size,
      }));

    return leaderboard;
  }

  async getUserStats(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
    });

    const contributions = await this.prisma.goalContribution.findMany({
      where: { userId },
    });

    const totalXP = goals.reduce((sum, g) => sum + g.xpPoints, 0);
    const totalBadges = new Set(goals.flatMap((g) => g.badges)).size;
    const maxLevel = Math.max(...goals.map((g) => g.level), 0);
    const maxStreak = Math.max(...goals.map((g) => g.longestStreak), 0);
    const totalContributions = contributions.length;
    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const activeGoals = goals.filter((g) => g.isActive && g.status !== 'COMPLETED').length;

    return {
      totalXP,
      level: maxLevel,
      totalBadges,
      longestStreak: maxStreak,
      totalContributions,
      totalContributed,
      completedGoals,
      activeGoals,
      goalsInProgress: goals.filter((g) => g.status === 'IN_PROGRESS').length,
    };
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getGoalAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const goals = await this.prisma.goal.findMany({
      where,
      include: {
        contributions: true,
        milestones: true,
      },
    });

    const contributions = goals.flatMap((g) => g.contributions);

    // Calculate metrics
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    const totalContributions = contributions.length;
    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);
    const averageContribution = totalContributions > 0 ? totalContributed / totalContributions : 0;

    const goalsByType = goals.reduce((acc, g) => {
      acc[g.type] = (acc[g.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const goalsByStatus = goals.reduce((acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalGoals,
        completedGoals,
        completionRate: Math.round(completionRate),
        totalTargetAmount,
        totalCurrentAmount,
        overallProgress: Math.round(overallProgress),
        totalContributions,
        totalContributed,
        averageContribution: Math.round(averageContribution),
      },
      goalsByType,
      goalsByStatus,
      topGoals: goals
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          name: g.name,
          progress: g.progress,
          currentAmount: g.currentAmount,
          targetAmount: g.targetAmount,
        })),
    };
  }
}

