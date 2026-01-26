import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, createGoalDto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        ...createGoalDto,
        userId,
        progress: 0,
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
}
