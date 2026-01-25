import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(userId: string, period?: string) {
    const where: any = { userId, isActive: true };

    if (period) {
      where.period = period;
    }

    return this.prisma.budget.findMany({
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
    });
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
        type: budget.category.type,
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
    await Promise.all(budgets.map((budget) => this.updateProgress(budget.id)));

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

    const alerts: any[] = [];

    for (const budget of budgets) {
      const percentUsed = (budget.spent / budget.amount) * 100;

      if (percentUsed >= budget.alertThreshold * 100) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          category: budget.category.name,
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
}
