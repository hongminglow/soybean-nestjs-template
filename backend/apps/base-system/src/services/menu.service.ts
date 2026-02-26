import { BadRequestException, Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';

import { ROOT_ROUTE_PID } from '@lib/shared/prisma/db.constant';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

export type RouteMeta = {
  title: string;
  i18nKey: string | null;
  keepAlive: boolean | null;
  constant: boolean;
  icon: string | null;
  order: number;
  href: string | null;
  hideInMenu: boolean | null;
  activeMenu: string | null;
  multiTab: boolean | null;
};

export type MenuRoute = {
  name: string;
  path: string;
  component: string;
  meta: RouteMeta;
  children?: MenuRoute[];
};

export type UserRoute = {
  routes: MenuRoute[];
  home: string;
};

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  private async syncMenuIdSequence(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('sys_menu', 'id'),
        COALESCE((SELECT MAX(id) FROM sys_menu), 1),
        true
      )
    `);
  }

  async getAllMenus() {
    return this.prisma.sysMenu.findMany();
  }

  async getMenusTree(constant?: boolean) {
    const where = constant !== undefined ? { constant } : {};
    return this.prisma.sysMenu.findMany({ where });
  }

  async createMenu(data: {
    menuName: string;
    menuType: any;
    iconType: number | null;
    icon: string | null;
    routeName: string;
    routePath: string;
    component: string;
    pathParam?: string | null;
    status: Status;
    activeMenu: string | null;
    hideInMenu: boolean | null;
    pid: number;
    order: number;
    i18nKey: string | null;
    keepAlive: boolean | null;
    constant: boolean;
    href: string | null;
    multiTab: boolean | null;
    uid: string;
  }): Promise<void> {
    if (data.pid !== ROOT_ROUTE_PID) {
      const parent = await this.prisma.sysMenu.findUnique({
        where: { id: data.pid },
      });
      if (!parent) {
        throw new BadRequestException('Parent menu not found.');
      }
    }

    await this.syncMenuIdSequence();

    await this.prisma.sysMenu.create({
      data: {
        menuName: data.menuName,
        menuType: data.menuType,
        iconType: data.iconType,
        icon: data.icon,
        routeName: data.routeName,
        routePath: data.routePath,
        component: data.component,
        pathParam: data.pathParam,
        status: data.status,
        activeMenu: data.activeMenu,
        hideInMenu: data.hideInMenu,
        pid: data.pid,
        order: data.order,
        i18nKey: data.i18nKey,
        keepAlive: data.keepAlive,
        constant: data.constant,
        href: data.href,
        multiTab: data.multiTab,
        createdBy: data.uid,
        createdAt: new Date(),
      },
    });
  }

  async updateMenu(data: {
    id: number;
    menuName: string;
    menuType: any;
    iconType: number | null;
    icon: string | null;
    routeName: string;
    routePath: string;
    component: string;
    pathParam?: string | null;
    status: Status;
    activeMenu: string | null;
    hideInMenu: boolean | null;
    pid: number;
    order: number;
    i18nKey: string | null;
    keepAlive: boolean | null;
    constant: boolean;
    href: string | null;
    multiTab: boolean | null;
    uid: string;
  }): Promise<void> {
    if (data.pid !== ROOT_ROUTE_PID && data.pid !== data.id) {
      const parent = await this.prisma.sysMenu.findUnique({
        where: { id: data.pid },
      });
      if (!parent) {
        throw new BadRequestException('Parent menu not found.');
      }
    }

    if (data.pid === data.id) {
      throw new BadRequestException('A menu cannot be its own parent.');
    }

    await this.prisma.sysMenu.update({
      where: { id: data.id },
      data: {
        menuName: data.menuName,
        menuType: data.menuType,
        iconType: data.iconType,
        icon: data.icon,
        routeName: data.routeName,
        routePath: data.routePath,
        component: data.component,
        pathParam: data.pathParam,
        status: data.status,
        activeMenu: data.activeMenu,
        hideInMenu: data.hideInMenu,
        pid: data.pid,
        order: data.order,
        i18nKey: data.i18nKey,
        keepAlive: data.keepAlive,
        constant: data.constant,
        href: data.href,
        multiTab: data.multiTab,
        updatedBy: data.uid,
        updatedAt: new Date(),
      },
    });
  }

  async deleteMenu(id: number): Promise<void> {
    const childrenCount = await this.prisma.sysMenu.count({
      where: { pid: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete menu with children. Delete children first.',
      );
    }

    await this.prisma.sysMenu.delete({ where: { id } });
  }

  async getMenuIdsByRoleIdAndDomain(
    roleId: string,
    domain: string,
  ): Promise<number[]> {
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId, domain },
      select: { menuId: true },
    });
    return roleMenus.map((rm) => rm.menuId);
  }

  async getUserRoutes(roleCode: string[], domain: string): Promise<UserRoute> {
    // Get role IDs from role codes
    const roles = await this.prisma.sysRole.findMany({
      where: { code: { in: roleCode } },
      select: { id: true },
    });
    const roleIds = roles.map((role) => role.id);

    // Get menu IDs for these roles in this domain
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: { in: roleIds }, domain },
      select: { menuId: true },
    });
    const menuIds = roleMenus.map((rm) => rm.menuId);

    if (menuIds.length === 0) {
      return { home: '', routes: [] };
    }

    const menus = await this.prisma.sysMenu.findMany({
      where: { id: { in: menuIds }, status: Status.ENABLED },
    });

    return {
      routes: this.buildMenuTree(menus),
      home: 'home',
    };
  }

  async getConstantRoutes(): Promise<MenuRoute[]> {
    const constantMenus = await this.prisma.sysMenu.findMany({
      where: { constant: true, status: Status.ENABLED },
    });

    return constantMenus.map((menu) => ({
      name: menu.menuName,
      path: menu.routePath,
      component: menu.component,
      meta: {
        title: menu.menuName,
        i18nKey: menu.i18nKey,
        constant: menu.constant,
        hideInMenu: menu.hideInMenu,
        keepAlive: menu.keepAlive,
        icon: menu.icon,
        order: menu.order,
        href: menu.href,
        activeMenu: menu.activeMenu,
        multiTab: menu.multiTab,
      },
    }));
  }

  async isRouteExist(routeName: string): Promise<boolean> {
    const route = await this.prisma.sysMenu.findFirst({
      where: {
        routeName,
        status: Status.ENABLED,
      },
      select: { id: true },
    });

    return !!route;
  }

  private buildMenuTree(menus: any[], pid = ROOT_ROUTE_PID): MenuRoute[] {
    const menuMap = new Map<number, any[]>();
    menus.forEach((menu) => {
      const list = menuMap.get(menu.pid) || [];
      list.push(menu);
      menuMap.set(menu.pid, list);
    });

    const children = menuMap.get(pid) || [];
    children.sort((a: any, b: any) => a.order - b.order);

    return children.map((menu: any) => ({
      name: menu.routeName,
      path: menu.routePath,
      component: menu.component,
      meta: {
        title: menu.menuName,
        i18nKey: menu.i18nKey,
        keepAlive: menu.keepAlive,
        constant: menu.constant,
        icon: menu.icon,
        order: menu.order,
        href: menu.href,
        hideInMenu: menu.hideInMenu,
        activeMenu: menu.activeMenu,
        multiTab: menu.multiTab,
      },
      children: this.buildMenuTree(menus, menu.id),
    }));
  }
}
