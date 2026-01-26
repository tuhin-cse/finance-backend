import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, data: any) {
    return this.prisma.product.create({
      data: { ...data, organizationId },
    });
  }

  async findAll(organizationId: string, page: number = 1, limit: number = 10) {
    const where = { organizationId, isActive: true };

    const [docs, totalDocs] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId, isActive: true },
      include: { inventoryItems: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
