import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    // Verify account belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: createTransactionDto.accountId,
        userId,
      },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        userId,
        organizationId: account.organizationId,
      },
      include: {
        account: true,
        category: true,
      },
    });

    // Update account balance
    const newBalance = account.currentBalance + 
      (createTransactionDto.type === 'INCOME' 
        ? createTransactionDto.amount 
        : -createTransactionDto.amount);

    await this.prisma.account.update({
      where: { id: account.id },
      data: { currentBalance: newBalance },
    });

    return transaction;
  }

  async findAll(userId: string, filters?: FilterTransactionsDto) {
    const where: any = { userId };

    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    if (filters?.minAmount || filters?.maxAmount) {
      where.amount = {};
      if (filters.minAmount) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { merchantName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
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
        orderBy: { date: 'desc' },
        skip: filters?.skip || 0,
        take: filters?.take || 50,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      total,
      skip: filters?.skip || 0,
      take: filters?.take || 50,
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        account: true,
        category: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    await this.findOne(id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: {
        account: true,
        category: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    // Revert account balance
    const account = await this.prisma.account.findUnique({
      where: { id: transaction.accountId },
    });

    if (account) {
      const newBalance = account.currentBalance - 
        (transaction.type === 'INCOME' 
          ? transaction.amount 
          : -transaction.amount);

      await this.prisma.account.update({
        where: { id: account.id },
        data: { currentBalance: newBalance },
      });
    }

    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  async categorize(id: string, userId: string, categoryId: string) {
    await this.findOne(id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data: { 
        categoryId,
        isAutoCatego: false,
      },
      include: {
        category: true,
      },
    });
  }

  async reconcile(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data: { 
        isReconciled: true,
        reconciledAt: new Date(),
      },
    });
  }

  async getStatistics(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [income, expenses, total] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      totalIncome: income._sum.amount || 0,
      totalExpenses: expenses._sum.amount || 0,
      netIncome: (income._sum.amount || 0) - (expenses._sum.amount || 0),
      totalTransactions: total,
    };
  }
}
