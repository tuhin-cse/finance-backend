import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';

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

  findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, isActive: true },
      orderBy: [
        { status: 'asc' },
        { targetDate: 'asc' },
      ],
    });
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
