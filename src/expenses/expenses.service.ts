import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  findAll(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
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
