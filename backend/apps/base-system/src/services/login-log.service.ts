import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class LoginLogService {
  constructor(private readonly prisma: PrismaService) {}

  async pageLoginLogs(query: {
    current: number;
    size: number;
    username?: string;
    domain?: string;
    address?: string;
    type?: string;
  }): Promise<PaginationResult<any>> {
    const where: Prisma.SysLoginLogWhereInput = {};
    if (query.username) where.username = { contains: query.username };
    if (query.domain) where.domain = query.domain;
    if (query.address) where.address = { contains: query.address };
    if (query.type) where.type = query.type;

    const loginLogs = await this.prisma.sysLoginLog.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      orderBy: [{ loginTime: 'desc' }],
    });
    const total = await this.prisma.sysLoginLog.count({ where });
    return new PaginationResult(query.current, query.size, total, loginLogs);
  }
}
