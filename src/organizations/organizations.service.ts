import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        userIds: [userId],
      } as any,
    });
  }

  async findAll(userId: string) {
    return this.prisma.organization.findMany({
      where: {
        userIds: {
          has: userId,
        },
        isActive: true,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        userIds: {
          has: userId,
        },
        isActive: true,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        teams: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    userId: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ) {
    // Verify user has access
    await this.findOne(id, userId);

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...updateOrganizationDto,
      } as any,
    });
  }

  async remove(id: string, userId: string) {
    // Verify user has access
    await this.findOne(id, userId);

    return this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addUser(organizationId: string, userId: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        userIds: {
          push: userId,
        },
      },
    });
  }

  async removeUser(organizationId: string, userId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        userIds: organization.userIds.filter((id) => id !== userId),
      },
    });
  }
}
