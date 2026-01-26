import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, data: any) {
    return this.prisma.expense.create({
      data: {
        ...data,
        userId,
        reimbursementStatus: data.isReimbursable ? 'PENDING' : undefined,
        approvalStatus: 'PENDING',
      },
    });
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const where = { userId };

    const [docs, totalDocs] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.expense.delete({ where: { id } });
  }

  async approve(id: string, userId: string, approverId: string) {
    await this.findOne(id, userId);
    
    return this.prisma.expense.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });
  }
}
