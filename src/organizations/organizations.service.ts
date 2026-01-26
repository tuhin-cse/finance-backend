import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        userOrganizations: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        userOrganizations: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const where = {
      userOrganizations: {
        some: {
          userId,
        },
      },
      isActive: true,
    };

    const [docs, totalDocs] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        include: {
          userOrganizations: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return createPaginatedResponse(docs, totalDocs, page, limit);
  }

  async findOne(id: string, userId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        userOrganizations: {
          some: {
            userId,
          },
        },
        isActive: true,
      },
      include: {
        userOrganizations: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
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
      data: updateOrganizationDto,
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

  async addUser(organizationId: string, userId: string, role?: string) {
    // Check if user is already a member
    const existing = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this organization');
    }

    return this.prisma.userOrganization.create({
      data: {
        userId,
        organizationId,
        role: role || 'MEMBER',
      },
    });
  }

  async removeUser(organizationId: string, userId: string) {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new NotFoundException('User is not a member of this organization');
    }

    return this.prisma.userOrganization.delete({
      where: {
        id: userOrg.id,
      },
    });
  }
}
