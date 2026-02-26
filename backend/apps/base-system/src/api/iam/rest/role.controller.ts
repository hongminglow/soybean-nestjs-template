import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, AuthActionVerb, UsePermissions } from '@lib/infra/casbin';
import { ApiRes } from '@lib/infra/rest/res.response';
import { IAuthentication } from '@lib/typings/global';

import { RoleService } from '../../../services/role.service';
import { PageRolesDto } from '../dto/page-roles.dto';
import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';

@ApiTags('Role - Module')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'role', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated roles' })
  async pageRoles(@Query() dto: PageRolesDto): Promise<ApiRes<any>> {
    const result = await this.roleService.pageRoles({
      current: dto.current,
      size: dto.size,
      code: dto.code,
      name: dto.name,
      status: dto.status,
    });
    return ApiRes.success(result);
  }

  @Post()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'role', action: AuthActionVerb.CREATE })
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(
    @Body() dto: RoleCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.roleService.createRole({
      code: dto.code,
      name: dto.name,
      pid: dto.pid,
      status: dto.status,
      description: dto.description,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Put()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'role', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Update role' })
  async updateRole(
    @Body() dto: RoleUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.roleService.updateRole({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      pid: dto.pid,
      status: dto.status,
      description: dto.description,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Delete()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'role', action: AuthActionVerb.DELETE })
  @ApiOperation({ summary: 'Delete role by ID' })
  async deleteRole(@Query('id') id: string): Promise<ApiRes<null>> {
    await this.roleService.deleteRole(id);
    return ApiRes.ok();
  }
}
