import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

import { EVENT_API_ROUTE_COLLECTED } from '@lib/constants/event-emitter-token.constant';
import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

export interface EndpointProperties {
  id: string;
  path: string;
  method: string;
  action: string;
  resource: string;
  controller: string;
  summary: string | null;
  createdAt?: Date;
  updatedAt?: Date | null;
}

@Injectable()
export class EndpointService implements OnModuleInit {
  private readonly logger = new Logger(EndpointService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log('EndpointService initialized');
    this.eventEmitter.on(
      EVENT_API_ROUTE_COLLECTED,
      this.saveEndpoints.bind(this),
    );
  }

  @OnEvent(EVENT_API_ROUTE_COLLECTED)
  async saveEndpoints(payload: EndpointProperties[]) {
    this.logger.log(`Handling ${payload.length} API endpoints`);
    try {
      const existingEndpoints = await this.prisma.sysEndpoint.findMany();
      const existingIds = existingEndpoints.map((ep) => ep.id);
      const newIds = payload.map((ep) => ep.id);
      const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

      const upsertPromises = payload.map((endpoint) =>
        this.prisma.sysEndpoint.upsert({
          where: { id: endpoint.id },
          update: {
            path: endpoint.path,
            method: endpoint.method,
            action: endpoint.action,
            resource: endpoint.resource,
            controller: endpoint.controller,
            summary: endpoint.summary,
          },
          create: endpoint,
        }),
      );

      const deletePromise = this.prisma.sysEndpoint.deleteMany({
        where: { id: { in: idsToDelete } },
      });

      await this.prisma.$transaction([...upsertPromises, deletePromise]);
      this.logger.log('API endpoints saved successfully');
    } catch (error) {
      this.logger.error('Failed to save API endpoints', error.stack);
    }
  }

  async pageEndpoints(query: {
    current: number;
    size: number;
    path?: string;
    method?: string;
    action?: string;
    resource?: string;
  }): Promise<PaginationResult<EndpointProperties>> {
    const where: Prisma.SysEndpointWhereInput = {};
    if (query.path) where.path = { contains: query.path };
    if (query.method) where.method = query.method;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = { contains: query.resource };

    const endpoints = await this.prisma.sysEndpoint.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      orderBy: [
        { createdAt: 'asc' },
        { controller: 'asc' },
        { path: 'asc' },
        { method: 'asc' },
        { action: 'asc' },
      ],
    });
    const total = await this.prisma.sysEndpoint.count({ where });
    return new PaginationResult(query.current, query.size, total, endpoints);
  }

  async getEndpointsTree() {
    const endpoints = await this.prisma.sysEndpoint.findMany();
    // Group by controller
    const grouped = new Map<string, EndpointProperties[]>();
    endpoints.forEach((ep) => {
      const list = grouped.get(ep.controller) || [];
      list.push(ep);
      grouped.set(ep.controller, list);
    });

    return Array.from(grouped.entries()).map(([controller, children]) => ({
      controller,
      children,
    }));
  }

  async getAuthApiEndpoint(roleCode: string, domain: string) {
    return this.prisma.casbinRule.findMany({
      where: { ptype: 'p', v0: roleCode, v3: domain },
    });
  }
}
