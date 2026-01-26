import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    const invoiceNumber = await this.generateInvoiceNumber();
    
    return this.prisma.invoice.create({
      data: {
        ...data,
        userId,
        invoiceNumber,
        amountDue: data.total,
      },
      include: { items: true, contact: true },
    });
  }

  async findAll(userId: string, status?: string, page: number = 1, limit: number = 10) {
    const where: any = { userId };
    if (status) where.status = status;
    
    const [docs, totalDocs] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { contact: true, _count: { select: { items: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true, contact: true, payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { items: true, contact: true },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.invoice.delete({ where: { id } });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  async markAsPaid(id: string, userId: string) {
    const invoice = await this.findOne(id, userId);
    
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        amountPaid: invoice.total,
        amountDue: 0,
        paidAt: new Date(),
      },
    });
  }
}
