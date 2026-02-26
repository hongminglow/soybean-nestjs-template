import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { ISecurityConfig, SecurityConfig } from '@lib/config';
import { CacheConstant } from '@lib/constants/cache.constant';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { IAuthentication } from '@lib/typings/global';

import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    @Inject(SecurityConfig.KEY) private securityConfig: ISecurityConfig,
  ) {}

  async login(dto: {
    identifier: string;
    password: string;
    ip: string;
    address: string;
    userAgent: string;
    requestId: string;
    type: string;
    port: number | null;
  }): Promise<{ token: string; refreshToken: string }> {
    const user = await this.userService.findUserByIdentifier(dto.identifier);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.status !== 'ENABLED') {
      throw new BadRequestException(`User is ${user.status.toLowerCase()}.`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials.');
    }

    const tokens = await this.generateAccessToken(
      user.id,
      user.username,
      user.domain,
    );

    // Save token record
    await this.prisma.sysTokens.create({
      data: {
        accessToken: tokens.token,
        refreshToken: tokens.refreshToken,
        status: 'UNUSED',
        userId: user.id,
        username: user.username,
        domain: user.domain,
        ip: dto.ip,
        port: dto.port,
        address: dto.address,
        userAgent: dto.userAgent,
        requestId: dto.requestId,
        type: dto.type,
        createdBy: user.id,
      },
    });

    // Save login log
    await this.prisma.sysLoginLog.create({
      data: {
        userId: user.id,
        username: user.username,
        domain: user.domain,
        loginTime: new Date(),
        ip: dto.ip,
        port: dto.port,
        address: dto.address,
        userAgent: dto.userAgent,
        requestId: dto.requestId,
        type: dto.type,
        createdAt: new Date(),
        createdBy: user.id,
      },
    });

    // Cache user roles in Redis
    const roles = await this.userService.findRolesByUserId(user.id);
    const key = `${CacheConstant.AUTH_TOKEN_PREFIX}${user.id}`;
    await RedisUtility.instance.del(key);
    if (roles.size > 0) {
      await RedisUtility.instance.sadd(key, ...roles);
      await RedisUtility.instance.expire(key, this.securityConfig.jwtExpiresIn);
    }

    return tokens;
  }

  async refreshToken(dto: {
    refreshToken: string;
    ip: string;
    region: string;
    userAgent: string;
    requestId: string;
    type: string;
    port: number | null;
  }): Promise<{ token: string; refreshToken: string }> {
    const tokenDetails = await this.prisma.sysTokens.findFirst({
      where: { refreshToken: dto.refreshToken },
    });

    if (!tokenDetails) {
      throw new NotFoundException('Refresh token not found.');
    }

    await this.jwtService.verifyAsync(tokenDetails.refreshToken, {
      secret: this.securityConfig.refreshJwtSecret,
    });

    if (tokenDetails.status === 'USED') {
      throw new BadRequestException('Refresh token has already been used.');
    }

    // Mark old token as used
    await this.prisma.sysTokens.update({
      where: { refreshToken: dto.refreshToken },
      data: { status: 'USED' },
    });

    const tokens = await this.generateAccessToken(
      tokenDetails.userId,
      tokenDetails.username,
      tokenDetails.domain,
    );

    // Save new token record
    await this.prisma.sysTokens.create({
      data: {
        accessToken: tokens.token,
        refreshToken: tokens.refreshToken,
        status: 'UNUSED',
        userId: tokenDetails.userId,
        username: tokenDetails.username,
        domain: tokenDetails.domain,
        ip: dto.ip,
        port: dto.port,
        address: dto.region,
        userAgent: dto.userAgent,
        requestId: dto.requestId,
        type: dto.type,
        createdBy: tokenDetails.userId,
      },
    });

    return tokens;
  }

  private async generateAccessToken(
    userId: string,
    username: string,
    domain: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const payload: IAuthentication = { uid: userId, username, domain };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.securityConfig.refreshJwtSecret,
      expiresIn: this.securityConfig.refreshJwtExpiresIn,
    });
    return { token: accessToken, refreshToken };
  }
}
