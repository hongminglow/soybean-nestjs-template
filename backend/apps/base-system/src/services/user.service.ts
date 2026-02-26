import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PaginationResult } from '@lib/shared/prisma/pagination';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { UlidGenerator } from '@lib/utils/id.util';

export interface UserProperties {
  id: string;
  username: string;
  password?: string;
  nickName: string;
  avatar: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: Status;
  domain: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly USER_ESSENTIAL_FIELDS = {
    id: true,
    username: true,
    domain: true,
    avatar: true,
    email: true,
    phoneNumber: true,
    nickName: true,
    status: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    password: false,
  };

  async pageUsers(query: {
    current: number;
    size: number;
    username?: string;
    nickName?: string;
    status?: Status;
  }): Promise<PaginationResult<UserProperties>> {
    const where: Prisma.SysUserWhereInput = {};
    if (query.username) where.username = { contains: query.username };
    if (query.nickName) where.nickName = { contains: query.nickName };
    if (query.status) where.status = query.status;

    const users = await this.prisma.sysUser.findMany({
      where,
      skip: (query.current - 1) * query.size,
      take: query.size,
      select: this.USER_ESSENTIAL_FIELDS,
    });
    const total = await this.prisma.sysUser.count({ where });
    return new PaginationResult<UserProperties>(
      query.current,
      query.size,
      total,
      users,
    );
  }

  async createUser(data: {
    username: string;
    password: string;
    domain: string;
    nickName: string;
    avatar: string | null;
    email: string | null;
    phoneNumber: string | null;
    uid: string;
  }): Promise<void> {
    const existingUser = await this.prisma.sysUser.findUnique({
      where: { username: data.username },
    });
    if (existingUser) {
      throw new BadRequestException(
        `A user with code ${data.username} already exists.`,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const defaultRole = await this.prisma.sysRole.findFirst({
      where: { code: 'ROLE_USER', status: Status.ENABLED },
      select: { id: true },
    });

    if (!defaultRole) {
      throw new NotFoundException('Default role ROLE_USER does not exist.');
    }

    const userId = UlidGenerator.generate();

    await this.prisma.$transaction([
      this.prisma.sysUser.create({
        data: {
          id: userId,
          username: data.username,
          nickName: data.nickName,
          password: hashedPassword,
          domain: data.domain,
          status: Status.ENABLED,
          avatar: data.avatar,
          email: data.email,
          phoneNumber: data.phoneNumber,
          createdAt: new Date(),
          createdBy: data.uid,
        },
      }),
      this.prisma.sysUserRole.create({
        data: {
          userId,
          roleId: defaultRole.id,
        },
      }),
    ]);
  }

  async updateUser(data: {
    id: string;
    username: string;
    nickName: string;
    avatar: string | null;
    email: string | null;
    phoneNumber: string | null;
    uid: string;
  }): Promise<void> {
    const existingUser = await this.prisma.sysUser.findUnique({
      where: { username: data.username },
    });
    if (existingUser && existingUser.id !== data.id) {
      throw new BadRequestException(
        `A user with account ${data.username} already exists.`,
      );
    }

    await this.prisma.sysUser.update({
      where: { id: data.id },
      data: {
        nickName: data.nickName,
        avatar: data.avatar,
        email: data.email,
        phoneNumber: data.phoneNumber,
        updatedAt: new Date(),
        updatedBy: data.uid,
      },
    });
  }

  async deleteUser(id: string): Promise<void> {
    const existingUser = await this.prisma.sysUser.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new BadRequestException(
        'A user with the specified ID does not exist.',
      );
    }

    await this.prisma.sysUser.delete({ where: { id } });
    // Cascade: delete user-role mappings
    await this.prisma.sysUserRole.deleteMany({ where: { userId: id } });
  }

  async findUserByIdentifier(identifier: string) {
    return this.prisma.sysUser.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { phoneNumber: identifier },
        ],
      },
    });
  }

  async findUsersByIds(ids: string[]): Promise<UserProperties[]> {
    return this.prisma.sysUser.findMany({ where: { id: { in: ids } } });
  }

  async findUserIdsByRoleId(roleId: string): Promise<string[]> {
    const results = await this.prisma.sysUserRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    return results.map((item) => item.userId);
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

  async deleteUserRoleByRoleId(roleId: string): Promise<void> {
    await this.prisma.sysUserRole.deleteMany({ where: { roleId } });
  }

  async deleteUserRoleByDomain(domain: string): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      const users = await prisma.sysUser.findMany({
        where: { domain },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);
      if (userIds.length === 0) return;
      await prisma.sysUser.deleteMany({ where: { id: { in: userIds } } });
      await prisma.sysUserRole.deleteMany({
        where: { userId: { in: userIds } },
      });
    });
  }
}
