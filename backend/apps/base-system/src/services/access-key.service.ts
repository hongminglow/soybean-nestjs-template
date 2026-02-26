import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';

import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@lib/infra/guard/api-key/api-key.constants';
import { IApiKeyService } from '@lib/infra/guard/api-key/services/api-key.interface';
import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { UlidGenerator } from '@lib/utils/id.util';

@Injectable()
export class AccessKeyService implements OnModuleInit {
  private readonly logger = new Logger(AccessKeyService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleApiKeyService: IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexApiKeyService: IApiKeyService,
  ) {}

  async onModuleInit() {
    const allKeys = await this.prisma.sysAccessKey.findMany();
    this.logger.log(`Loading ${allKeys.length} access keys on startup`);
    await Promise.all(
      allKeys.flatMap((key) => [
        this.complexApiKeyService.addKey(key.AccessKeyID, key.AccessKeySecret),
        this.simpleApiKeyService.addKey(key.AccessKeyID),
      ]),
    );
  }

  async pageAccessKeys(query: {
    current: number;
    size: number;
    domain?: string;
    status?: Status;
  }): Promise<PaginationResult<any>> {
    const where: Prisma.SysAccessKeyWhereInput = {};
    if (query.domain) where.domain = { contains: query.domain };
    if (query.status) where.status = query.status;

    const accessKeys = await this.prisma.sysAccessKey.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      select: {
        id: true,
        domain: true,
        AccessKeyID: true,
        status: true,
        description: true,
        createdAt: true,
        createdBy: true,
      },
    });
    const total = await this.prisma.sysAccessKey.count({ where });
    return new PaginationResult(query.current, query.size, total, accessKeys);
  }

  async createAccessKey(data: {
    domain: string | null;
    description: string | null;
    uid: string;
  }): Promise<void> {
    const accessKeyID = UlidGenerator.generate();
    const accessKeySecret = UlidGenerator.generate();

    await this.prisma.sysAccessKey.create({
      data: {
        id: UlidGenerator.generate(),
        domain: data.domain ?? '',
        AccessKeyID: accessKeyID,
        AccessKeySecret: accessKeySecret,
        status: Status.ENABLED,
        description: data.description,
        createdAt: new Date(),
        createdBy: data.uid,
      },
    });

    // Register in api key services
    await this.simpleApiKeyService.addKey(accessKeyID);
    await this.complexApiKeyService.addKey(accessKeyID, accessKeySecret);
  }

  async deleteAccessKey(id: string): Promise<void> {
    const existing = await this.prisma.sysAccessKey.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException(
        'An access key with the specified ID does not exist.',
      );
    }

    await this.prisma.sysAccessKey.delete({ where: { id } });

    // Remove from api key services
    await this.simpleApiKeyService.removeKey(existing.AccessKeyID);
    await this.complexApiKeyService.removeKey(existing.AccessKeyID);
  }
}
