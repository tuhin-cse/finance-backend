import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        userId,
      },
    });
  }

  async findAll(userId: string, organizationId?: string) {
    const where: any = { userId, isActive: true };
    
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.prisma.account.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
      include: {
        transactions: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(id: string, userId: string, updateAccountDto: UpdateAccountDto) {
    await this.findOne(id, userId);

    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateBalance(id: string, userId: string, balance: number) {
    await this.findOne(id, userId);

    return this.prisma.account.update({
      where: { id },
      data: { 
        currentBalance: balance,
        updatedAt: new Date(),
      },
    });
  }

  async syncAccount(id: string, userId: string) {
    await this.findOne(id, userId);

    // TODO: Implement Plaid sync logic here
    return this.prisma.account.update({
      where: { id },
      data: { 
        lastSyncedAt: new Date(),
      },
    });
  }

  async getAccountBalance(id: string, userId: string) {
    const account = await this.findOne(id, userId);
    return {
      currentBalance: account.currentBalance,
      availableBalance: account.availableBalance,
      currency: account.currency,
    };
  }
}
