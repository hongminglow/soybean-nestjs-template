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

import { SystemConfigService } from '../../../services/config.service';
import { ConfigCreateDto, ConfigUpdateDto } from '../dto/config.dto';
import { PageConfigQueryDto } from '../dto/page-config.dto';

@ApiTags('Config - Module')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'config', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated configs' })
  async pageConfigs(@Query() dto: PageConfigQueryDto): Promise<ApiRes<any>> {
    const result = await this.configService.pageConfigs({
      current: dto.current,
      size: dto.size,
      configKey: dto.configKey,
      status: dto.status,
    });

    return ApiRes.success(result);
  }

  @Post()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'config', action: AuthActionVerb.CREATE })
  @ApiOperation({ summary: 'Create config' })
  async createConfig(
    @Body() dto: ConfigCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;

    await this.configService.createConfig({
      configKey: dto.configKey,
      configValue: dto.configValue,
      status: dto.status,
      uid: user.uid,
    });

    return ApiRes.ok();
  }

  @Put()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'config', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Update config by ID' })
  async updateConfig(
    @Body() dto: ConfigUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;

    await this.configService.updateConfig({
      id: dto.id,
      configKey: dto.configKey,
      configValue: dto.configValue,
      status: dto.status,
      uid: user.uid,
    });

    return ApiRes.ok();
  }

  @Delete()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'config', action: AuthActionVerb.DELETE })
  @ApiOperation({ summary: 'Delete config by ID' })
  async deleteConfig(@Query('id') id: string): Promise<ApiRes<null>> {
    await this.configService.deleteConfig(id);
    return ApiRes.ok();
  }
}
