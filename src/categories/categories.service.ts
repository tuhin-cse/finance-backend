import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, CategoryType } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private async seedDefaultCategories() {
    const existingCategories = await this.prisma.category.count();
    if (existingCategories > 0) return;

    const defaultCategories = [
      // Income Categories
      {
        name: 'Salary',
        type: CategoryType.INCOME,
        icon: '💼',
        color: '#10B981',
        isSystem: true,
      },
      {
        name: 'Freelance',
        type: CategoryType.INCOME,
        icon: '💻',
        color: '#3B82F6',
        isSystem: true,
      },
      {
        name: 'Investment',
        type: CategoryType.INCOME,
        icon: '📈',
        color: '#8B5CF6',
        isSystem: true,
      },
      {
        name: 'Business',
        type: CategoryType.INCOME,
        icon: '🏢',
        color: '#06B6D4',
        isSystem: true,
      },
      {
        name: 'Other Income',
        type: CategoryType.INCOME,
        icon: '💰',
        color: '#14B8A6',
        isSystem: true,
      },

      // Expense Categories
      {
        name: 'Food & Dining',
        type: CategoryType.EXPENSE,
        icon: '🍔',
        color: '#EF4444',
        isSystem: true,
      },
      {
        name: 'Groceries',
        type: CategoryType.EXPENSE,
        icon: '🛒',
        color: '#F59E0B',
        isSystem: true,
      },
      {
        name: 'Transportation',
        type: CategoryType.EXPENSE,
        icon: '🚗',
        color: '#3B82F6',
        isSystem: true,
      },
      {
        name: 'Shopping',
        type: CategoryType.EXPENSE,
        icon: '🛍️',
        color: '#EC4899',
        isSystem: true,
      },
      {
        name: 'Entertainment',
        type: CategoryType.EXPENSE,
        icon: '🎬',
        color: '#8B5CF6',
        isSystem: true,
      },
      {
        name: 'Bills & Utilities',
        type: CategoryType.EXPENSE,
        icon: '📄',
        color: '#6B7280',
        isSystem: true,
      },
      {
        name: 'Healthcare',
        type: CategoryType.EXPENSE,
        icon: '🏥',
        color: '#EF4444',
        isSystem: true,
      },
      {
        name: 'Education',
        type: CategoryType.EXPENSE,
        icon: '🎓',
        color: '#3B82F6',
        isSystem: true,
      },
      {
        name: 'Travel',
        type: CategoryType.EXPENSE,
        icon: '✈️',
        color: '#06B6D4',
        isSystem: true,
      },
      {
        name: 'Insurance',
        type: CategoryType.EXPENSE,
        icon: '🛡️',
        color: '#10B981',
        isSystem: true,
      },
      {
        name: 'Housing',
        type: CategoryType.EXPENSE,
        icon: '🏠',
        color: '#F59E0B',
        isSystem: true,
      },
      {
        name: 'Personal Care',
        type: CategoryType.EXPENSE,
        icon: '💇',
        color: '#EC4899',
        isSystem: true,
      },
      {
        name: 'Subscriptions',
        type: CategoryType.EXPENSE,
        icon: '📱',
        color: '#8B5CF6',
        isSystem: true,
      },
      {
        name: 'Gifts & Donations',
        type: CategoryType.EXPENSE,
        icon: '🎁',
        color: '#F43F5E',
        isSystem: true,
      },
      {
        name: 'Other Expense',
        type: CategoryType.EXPENSE,
        icon: '💸',
        color: '#6B7280',
        isSystem: true,
      },

      // Transfer
      {
        name: 'Transfer',
        type: CategoryType.TRANSFER,
        icon: '🔄',
        color: '#6366F1',
        isSystem: true,
      },
    ];

    await this.prisma.category.createMany({
      data: defaultCategories,
    });
  }

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        isSystem: false,
      },
    });
  }

  async findAll(type?: string, page: number = 1, limit: number = 10) {
    const where: any = { isActive: true };

    if (type) {
      where.type = type;
    }

    const [docs, totalDocs] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: {
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        _count: {
          select: { transactions: true, budgets: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (category.isSystem) {
      throw new NotFoundException('Cannot update system category');
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    if (category.isSystem) {
      throw new NotFoundException('Cannot delete system category');
    }

    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCategorySpending(
    categoryId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { categoryId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: result._sum.amount || 0,
      count: result._count,
    };
  }
}
