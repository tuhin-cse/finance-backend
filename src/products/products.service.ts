import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, data: any) {
    return this.prisma.product.create({
      data: { ...data, organizationId },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
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
