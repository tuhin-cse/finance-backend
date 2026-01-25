import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, data: any) {
    return this.prisma.project.create({
      data: { ...data, userId, actualCost: 0 },
      include: { tasks: true },
    });
  }

  findAll(userId: string, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;
    
    return this.prisma.project.findMany({
      where,
      include: { _count: { select: { tasks: true, timeEntries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { tasks: true, timeEntries: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    return this.prisma.project.update({
      where: { id },
      data,
      include: { tasks: true },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.project.delete({ where: { id } });
  }
}
