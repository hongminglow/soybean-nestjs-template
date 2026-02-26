import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';

import { AuthZRBACService } from '@lib/infra/casbin';
import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import { UserService } from './user.service';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authZRBACService: AuthZRBACService,
    private readonly userService: UserService,
  ) {}

  async assignPermission(data: {
    domain: string;
    roleId: string;
    permissions: string[];
  }): Promise<void> {
    const { domainCode, roleCode } = await this.checkDomainAndRole(
      data.domain,
      data.roleId,
    );

    const permissions = await this.prisma.sysEndpoint.findMany({
      where: { id: { in: data.permissions } },
    });
    if (!permissions.length) {
      throw new NotFoundException('One or more permissions not found.');
    }

    const existingPermissions =
      await this.authZRBACService.enforcer.getFilteredPolicy(
        0,
        roleCode,
        '',
        '',
        domainCode,
      );

    await this.syncRolePermissions(
      roleCode,
      domainCode,
      permissions,
      existingPermissions,
    );
  }

  async assignRoutes(data: {
    domain: string;
    roleId: string;
    menuIds: number[];
  }): Promise<void> {
    const { domainCode, roleId } = await this.checkDomainAndRole(
      data.domain,
      data.roleId,
    );

    const routes = await this.prisma.sysMenu.findMany({
      where: { id: { in: data.menuIds } },
    });
    if (!routes.length) {
      throw new NotFoundException('One or more routes not found.');
    }

    // Get existing route IDs for this role+domain
    const existingRoleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId, domain: domainCode },
      select: { menuId: true },
    });
    const existingRouteIds = existingRoleMenus.map((rm) => rm.menuId);

    const newRouteIds = data.menuIds.filter(
      (id) => !existingRouteIds.includes(id),
    );
    const routeIdsToDelete = existingRouteIds.filter(
      (id) => !data.menuIds.includes(id),
    );

    const operations = [
      ...newRouteIds.map((routeId) =>
        this.prisma.sysRoleMenu.create({
          data: { roleId, menuId: routeId, domain: domainCode },
        }),
      ),
      ...routeIdsToDelete.map((routeId) =>
        this.prisma.sysRoleMenu.deleteMany({
          where: { roleId, menuId: routeId, domain: domainCode },
        }),
      ),
    ];

    await this.prisma.$transaction(operations);
  }

  async assignUsers(data: {
    roleId: string;
    userIds: string[];
  }): Promise<void> {
    await this.checkRole(data.roleId);

    const users = await this.userService.findUsersByIds(data.userIds);
    if (!users.length) {
      throw new NotFoundException('One or more users not found.');
    }

    const existingUserIds = await this.userService.findUserIdsByRoleId(
      data.roleId,
    );

    const newUserIds = data.userIds.filter(
      (id) => !existingUserIds.includes(id),
    );
    const userIdsToDelete = existingUserIds.filter(
      (id) => !data.userIds.includes(id),
    );

    const operations = [
      ...newUserIds.map((userId) =>
        this.prisma.sysUserRole.create({
          data: { roleId: data.roleId, userId },
        }),
      ),
      ...userIdsToDelete.map((userId) =>
        this.prisma.sysUserRole.deleteMany({
          where: { roleId: data.roleId, userId },
        }),
      ),
    ];

    await this.prisma.$transaction(operations);
  }

  private async checkDomainAndRole(domainCode: string, roleId: string) {
    const domain = await this.prisma.sysDomain.findUnique({
      where: { code: domainCode },
    });
    if (!domain) {
      throw new NotFoundException('Domain not found.');
    }

    const { roleCode } = await this.checkRole(roleId);
    return { domainCode: domain.code, roleId, roleCode };
  }

  private async checkRole(roleId: string) {
    const role = await this.prisma.sysRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found.');
    }
    return { roleCode: role.code };
  }

  private async syncRolePermissions(
    roleCode: string,
    domain: string,
    newPermissions: { resource: string; action: string }[],
    existingPermissions: string[][],
  ): Promise<void> {
    const newPermSet = new Set(
      newPermissions.map((perm) =>
        JSON.stringify([roleCode, perm.resource, perm.action, domain, 'allow']),
      ),
    );

    const existingPermSet = new Set(
      existingPermissions.map((perm) => JSON.stringify(perm)),
    );

    for (const perm of existingPermissions) {
      if (!newPermSet.has(JSON.stringify(perm))) {
        await this.authZRBACService.enforcer.removeFilteredPolicy(
          0,
          roleCode,
          perm[1],
          perm[2],
          domain,
        );
      }
    }

    for (const perm of newPermissions) {
      const permArray = [roleCode, perm.resource, perm.action, domain, 'allow'];
      if (!existingPermSet.has(JSON.stringify(permArray))) {
        await this.authZRBACService.enforcer.addPermissionForUser(
          roleCode,
          perm.resource,
          perm.action,
          domain,
        );
      }
    }
  }
}
