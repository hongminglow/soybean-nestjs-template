import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';

import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async pageConfigs(query: {
    current: number;
    size: number;
    configKey?: string;
    status?: Status;
  }): Promise<PaginationResult<any>> {
    const where: Prisma.SysConfigWhereInput = {};

    if (query.configKey) {
      where.configKey = { contains: query.configKey };
    }

    if (query.status) {
      where.status = query.status;
    }

    const configs = await this.prisma.sysConfig.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        configKey: true,
        configValue: true,
        status: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
      },
    });

    const total = await this.prisma.sysConfig.count({ where });

    return new PaginationResult(query.current, query.size, total, configs);
  }

  async createConfig(data: {
    configKey: string;
    configValue: string;
    status: Status;
    uid: string;
  }): Promise<void> {
    const existing = await this.prisma.sysConfig.findFirst({
      where: { configKey: data.configKey },
    });

    if (existing) {
      throw new BadRequestException(
        `A config with key ${data.configKey} already exists.`,
      );
    }

    await this.prisma.sysConfig.create({
      data: {
        configKey: data.configKey,
        configValue: data.configValue,
        status: data.status,
        createdAt: new Date(),
        createdBy: data.uid,
      },
    });
  }

  async updateConfig(data: {
    id: string;
    configKey: string;
    configValue: string;
    status: Status;
    uid: string;
  }): Promise<void> {
    const existing = await this.prisma.sysConfig.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new BadRequestException(
        'A config with the specified ID does not exist.',
      );
    }

    const duplicated = await this.prisma.sysConfig.findFirst({
      where: { configKey: data.configKey },
      select: { id: true },
    });

    if (duplicated && duplicated.id !== data.id) {
      throw new BadRequestException(
        `A config with key ${data.configKey} already exists.`,
      );
    }

    await this.prisma.sysConfig.update({
      where: { id: data.id },
      data: {
        configKey: data.configKey,
        configValue: data.configValue,
        status: data.status,
        updatedAt: new Date(),
        updatedBy: data.uid,
      },
    });
  }

  async deleteConfig(id: string): Promise<void> {
    const existing = await this.prisma.sysConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException(
        'A config with the specified ID does not exist.',
      );
    }

    await this.prisma.sysConfig.delete({ where: { id } });
  }
}
