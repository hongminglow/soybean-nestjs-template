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

import { AccessKeyService } from '../../../services/access-key.service';
import { AccessKeyCreateDto, AccessKeyUpdateDto } from '../dto/access_key.dto';
import { PageAccessKeysQueryDto } from '../dto/page-access_key.dto';

@ApiTags('AccessKey - Module')
@Controller('access-key')
export class AccessKeyController {
  constructor(private readonly accessKeyService: AccessKeyService) {}

  @Get('page')
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'access-key', action: AuthActionVerb.READ })
  @ApiOperation({ summary: 'Get paginated access keys' })
  async pageAccessKeys(
    @Query() dto: PageAccessKeysQueryDto,
  ): Promise<ApiRes<any>> {
    const result = await this.accessKeyService.pageAccessKeys({
      current: dto.current,
      size: dto.size,
      domain: dto.domain,
      status: dto.status,
    });
    return ApiRes.success(result);
  }

  @Post()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'access-key', action: AuthActionVerb.CREATE })
  @ApiOperation({ summary: 'Create a new access key' })
  async createAccessKey(
    @Body() dto: AccessKeyCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    const user: IAuthentication = req.user;
    await this.accessKeyService.createAccessKey({
      domain: dto.domain,
      description: dto.description,
      uid: user.uid,
    });
    return ApiRes.ok();
  }

  @Put()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'access-key', action: AuthActionVerb.UPDATE })
  @ApiOperation({ summary: 'Update access key by ID' })
  async updateAccessKey(
    @Body() dto: AccessKeyUpdateDto,
  ): Promise<ApiRes<null>> {
    await this.accessKeyService.updateAccessKey({
      id: dto.id,
      domain: dto.domain,
      status: dto.status,
      description: dto.description,
    });
    return ApiRes.ok();
  }

  @Delete()
  @UseGuards(AuthZGuard)
  @UsePermissions({ resource: 'access-key', action: AuthActionVerb.DELETE })
  @ApiOperation({ summary: 'Delete access key by ID' })
  async deleteAccessKey(@Query('id') id: string): Promise<ApiRes<null>> {
    await this.accessKeyService.deleteAccessKey(id);
    return ApiRes.ok();
  }
}
