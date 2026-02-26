import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';

import { AuthZManagementService } from '@lib/infra/casbin';
import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { UlidGenerator } from '@lib/utils/id.util';

import { UserService } from './user.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authZManagementService: AuthZManagementService,
    private readonly userService: UserService,
  ) {}

  async pageRoles(query: {
    current: number;
    size: number;
    code?: string;
    name?: string;
    status?: Status;
  }): Promise<PaginationResult<any>> {
    const where: Prisma.SysRoleWhereInput = {};
    if (query.code) where.code = { contains: query.code };
    if (query.name) where.name = { contains: query.name };
    if (query.status) where.status = query.status;

    const roles = await this.prisma.sysRole.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
    });
    const total = await this.prisma.sysRole.count({ where });
    return new PaginationResult(query.current, query.size, total, roles);
  }

  async createRole(data: {
    code: string;
    name: string;
    pid: string;
    status: Status;
    description: string | null;
    uid: string;
  }): Promise<void> {
    const existingRole = await this.prisma.sysRole.findUnique({
      where: { code: data.code },
    });
    if (existingRole) {
      throw new BadRequestException(
        `A role with code ${data.code} already exists.`,
      );
    }

    if (data.pid !== '0') {
      const parentRole = await this.prisma.sysRole.findUnique({
        where: { id: data.pid },
      });
      if (!parentRole) {
        throw new BadRequestException('Parent role not found.');
      }
    }

    await this.prisma.sysRole.create({
      data: {
        id: UlidGenerator.generate(),
        code: data.code,
        name: data.name,
        pid: data.pid,
        status: data.status,
        description: data.description,
        createdAt: new Date(),
        createdBy: data.uid,
      },
    });
  }

  async updateRole(data: {
    id: string;
    code: string;
    name: string;
    pid: string;
    status: Status;
    description: string | null;
    uid: string;
  }): Promise<void> {
    const existingRole = await this.prisma.sysRole.findUnique({
      where: { code: data.code },
    });
    if (existingRole && existingRole.id !== data.id) {
      throw new BadRequestException(
        `A role with code ${data.code} already exists.`,
      );
    }

    if (data.pid !== '0' && data.pid !== data.id) {
      const parentRole = await this.prisma.sysRole.findUnique({
        where: { id: data.pid },
      });
      if (!parentRole) {
        throw new BadRequestException('Parent role not found.');
      }
    }

    if (data.pid === data.id) {
      throw new BadRequestException('A role cannot be its own parent.');
    }

    await this.prisma.sysRole.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        pid: data.pid,
        status: data.status,
        description: data.description,
        updatedAt: new Date(),
        updatedBy: data.uid,
      },
    });
  }

  async deleteRole(id: string): Promise<void> {
    const existingRole = await this.prisma.sysRole.findUnique({
      where: { id },
    });
    if (!existingRole) {
      throw new BadRequestException(
        'A role with the specified ID does not exist.',
      );
    }

    await this.prisma.sysRole.delete({ where: { id } });

    // Cascade cleanup: remove casbin policies, role-menu mappings, user-role mappings
    await this.authZManagementService.removeFilteredPolicy(
      0,
      existingRole.code,
    );
    await this.prisma.sysRoleMenu.deleteMany({ where: { roleId: id } });
    await this.userService.deleteUserRoleByRoleId(id);
  }

  async findRolesByUserId(userId: string): Promise<Set<string>> {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId },
      select: { roleId: true },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await this.prisma.sysRole.findMany({
      where: { id: { in: roleIds } },
      select: { code: true },
    });
    return new Set(roles.map((role) => role.code));
  }
}
