import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';

import { AuthZManagementService } from '@lib/infra/casbin';
import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { UlidGenerator } from '@lib/utils/id.util';

import { UserService } from './user.service';

@Injectable()
export class DomainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authZManagementService: AuthZManagementService,
    private readonly userService: UserService,
  ) {}

  async pageDomains(query: {
    current: number;
    size: number;
    name?: string;
    status?: Status;
  }): Promise<PaginationResult<any>> {
    const where: Prisma.SysDomainWhereInput = {};
    if (query.name) where.name = { contains: query.name };
    if (query.status) where.status = query.status;

    const domains = await this.prisma.sysDomain.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      orderBy: [{ createdAt: 'desc' }],
    });
    const total = await this.prisma.sysDomain.count({ where });
    return new PaginationResult(query.current, query.size, total, domains);
  }

  async createDomain(data: {
    code: string;
    name: string;
    description: string | null;
    uid: string;
  }): Promise<void> {
    const existing = await this.prisma.sysDomain.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException(
        `A domain with code ${data.code} already exists.`,
      );
    }

    await this.prisma.sysDomain.create({
      data: {
        id: UlidGenerator.generate(),
        code: data.code,
        name: data.name,
        description: data.description,
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: data.uid,
      },
    });
  }

  async updateDomain(data: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    uid: string;
  }): Promise<void> {
    const existing = await this.prisma.sysDomain.findUnique({
      where: { code: data.code },
    });
    if (existing && existing.id !== data.id) {
      throw new BadRequestException(
        `A domain with code ${data.code} already exists.`,
      );
    }

    await this.prisma.sysDomain.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        updatedAt: new Date(),
        updatedBy: data.uid,
      },
    });
  }

  async deleteDomain(id: string): Promise<void> {
    const existing = await this.prisma.sysDomain.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException(
        'A domain with the specified ID does not exist.',
      );
    }

    await this.prisma.sysDomain.delete({ where: { id } });

    // Cascade cleanup
    await this.authZManagementService.removeFilteredPolicy(3, existing.code);
    await this.prisma.sysRoleMenu.deleteMany({
      where: { domain: existing.code },
    });
    await this.userService.deleteUserRoleByDomain(existing.code);
  }
}
