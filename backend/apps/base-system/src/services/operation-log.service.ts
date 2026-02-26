import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

import { EVENT_OPERATION_LOG_CREATED } from '@lib/constants/event-emitter-token.constant';
import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(EVENT_OPERATION_LOG_CREATED)
  async saveOperationLog(data: any) {
    await this.prisma.sysOperationLog.create({ data });
  }

  async pageOperationLogs(query: {
    current: number;
    size: number;
    username?: string;
    domain?: string;
    moduleName?: string;
    method?: string;
  }): Promise<PaginationResult<any>> {
    const where: Prisma.SysOperationLogWhereInput = {};
    if (query.username) where.username = { contains: query.username };
    if (query.domain) where.domain = query.domain;
    if (query.moduleName) where.moduleName = { contains: query.moduleName };
    if (query.method) where.method = query.method;

    const operationLogs = await this.prisma.sysOperationLog.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      orderBy: [{ createdAt: 'desc' }],
    });
    const total = await this.prisma.sysOperationLog.count({ where });
    return new PaginationResult(
      query.current,
      query.size,
      total,
      operationLogs,
    );
  }
}
