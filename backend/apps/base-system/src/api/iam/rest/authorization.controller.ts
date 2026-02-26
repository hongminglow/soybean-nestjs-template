import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CacheConstant } from '@lib/constants/cache.constant';
import { AuthZGuard, AuthActionVerb, UsePermissions } from '@lib/infra/casbin';
import { ApiRes } from '@lib/infra/rest/res.response';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { IAuthentication } from '@lib/typings/global';

import { AuthorizationService } from '../../../services/authorization.service';
import { MenuService } from '../../../services/menu.service';
import { AssignPermissionDto } from '../dto/assign-permission.dto';
import { AssignRouteDto } from '../dto/assign-route.dto';
import { AssignUserDto } from '../dto/assign-user.dto';

@ApiTags('Authorization - Module')
@Controller('authorization')
export class AuthorizationController {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly menuService: MenuService,
  ) {}

  @Post('assignPermission')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'authorization', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Assign permissions to a role' })
  async assignPermission(
    @Body() dto: AssignPermissionDto,
  ): Promise<ApiRes<null>> {
    await this.authorizationService.assignPermission({
      domain: dto.domain,
      roleId: dto.roleId,
      permissions: dto.permissions,
    });
    return ApiRes.ok();
  }

  @Post('assignRoutes')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'authorization', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Assign routes to a role' })
  async assignRoutes(@Body() dto: AssignRouteDto): Promise<ApiRes<null>> {
    await this.authorizationService.assignRoutes({
      domain: dto.domain,
      roleId: dto.roleId,
      menuIds: dto.routeIds,
    });
    return ApiRes.ok();
  }

  @Post('assignUsers')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'authorization', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Assign users to a role' })
  async assignUsers(@Body() dto: AssignUserDto): Promise<ApiRes<null>> {
    await this.authorizationService.assignUsers({
      roleId: dto.roleId,
      userIds: dto.userIds,
    });
    return ApiRes.ok();
  }

  @Get('getUserRoutes')
  @ApiOperation({ summary: 'Get user routes by role and domain' })
  async getUserRoutes(@Request() req: any): Promise<ApiRes<any>> {
    const user: IAuthentication = req.user;
    const userRoles = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
    );
    const result = await this.menuService.getUserRoutes(userRoles, user.domain);
    return ApiRes.success(result);
  }
}
