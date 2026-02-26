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
import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { IAuthentication } from '@lib/typings/global';

import { MenuService } from '../../../services/menu.service';
import { RouteCreateDto, RouteUpdateDto } from '../dto/route.dto';

@ApiTags('Menu - Module')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('all')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'menu', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get all menus' })
  async getAllMenus(): Promise<ApiRes<any>> {
    const result = await this.menuService.getAllMenus();
    return ApiRes.success(result);
  }

  @Get('tree')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'menu', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get menu tree' })
  async getMenusTree(
    @Query('constant') constant?: string,
  ): Promise<ApiRes<any>> {
    const isConstant = constant !== undefined ? constant === 'true' : undefined;
    const result = await this.menuService.getMenusTree(isConstant);
    return ApiRes.success(result);
  }

  @Post()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'menu', action: AuthActionVerb.CREATE })
  @ApiOperation({ summary: 'Create a new menu' })
  async createMenu(
    @Body() dto: RouteCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.menuService.createMenu({ ...dto, uid: user.uid });
    return ApiRes.ok();
  }

  @Put()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'menu', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Update menu' })
  async updateMenu(
    @Body() dto: RouteUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.menuService.updateMenu({ ...dto, uid: user.uid });
    return ApiRes.ok();
  }

  @Delete()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'menu', action: AuthActionVerb.DELETE })
  @ApiOperation({ summary: 'Delete menu by ID' })
  async deleteMenu(@Query('id') id: string): Promise<ApiRes<null>> {
    await this.menuService.deleteMenu(Number(id));
    return ApiRes.ok();
  }

  @Get('getConstantRoutes')
  @Public()
  @ApiOperation({ summary: 'Get constant routes' })
  async getConstantRoutes(): Promise<ApiRes<any>> {
    const result = await this.menuService.getConstantRoutes();
    return ApiRes.success(result);
  }

  @Get('getMenuIdsByRoleIdAndDomain')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'menu', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get menu IDs by role and domain' })
  async getMenuIdsByRoleIdAndDomain(
    @Query('roleId') roleId: string,
    @Query('domain') domain: string,
  ): Promise<ApiRes<any>> {
    const result = await this.menuService.getMenuIdsByRoleIdAndDomain(
      roleId,
      domain,
    );
    return ApiRes.success(result);
  }
}
