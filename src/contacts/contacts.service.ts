import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, data: any) {
    return this.prisma.contact.create({
      data: { ...data, userId },
    });
  }

  findAll(userId: string, type?: string) {
    const where: any = { userId, isActive: true };
    if (type) where.type = type;
    
    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId, isActive: true },
      include: { invoices: { take: 10, orderBy: { date: 'desc' } } },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    return this.prisma.contact.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.contact.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
